import Anthropic from '@anthropic-ai/sdk';
import {
  getChatbot,
  searchSimilarChunks,
  getServiceClient,
  type ConversationTurn,
  type McpServer,
} from './db';
import { embed } from './embedder';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ESCALATION_THRESHOLD = 0.4;
const HISTORY_TURNS = 10;

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function sseEvent(data: Record<string, unknown>): Uint8Array {
  return encodeText(`data: ${JSON.stringify(data)}\n\n`);
}

// ---------------------------------------------------------------------------
// Webhook delivery
// ---------------------------------------------------------------------------

type WebhookPayload = Record<string, unknown>;

async function deliverWebhook(
  webhookId: string,
  url: string,
  payload: WebhookPayload
): Promise<{ statusCode: number | null; responseBody: string | null; success: boolean }> {
  const delays = [1000, 2000, 4000];
  let lastStatusCode: number | null = null;
  let lastResponseBody: string | null = null;

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delays[attempt - 1]));
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      lastStatusCode = res.status;
      lastResponseBody = await res.text().catch(() => null);
      if (res.ok) {
        return { statusCode: lastStatusCode, responseBody: lastResponseBody, success: true };
      }
    } catch {
      // retry
    }
  }
  return { statusCode: lastStatusCode, responseBody: lastResponseBody, success: false };
}

async function fireWebhooks(
  chatbotId: string,
  event: string,
  payload: WebhookPayload
): Promise<void> {
  const db = getServiceClient();
  const { data: webhooks } = await db
    .from('cb_webhooks')
    .select('id, url')
    .eq('chatbot_id', chatbotId)
    .eq('enabled', true)
    .contains('events', [event]);

  if (!webhooks || webhooks.length === 0) return;

  await Promise.allSettled(
    webhooks.map(async (webhook: { id: string; url: string }) => {
      const { data: delivery } = await db
        .from('cb_webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event,
          payload,
          attempt_count: 0,
        })
        .select('id')
        .single();

      const deliveryId = delivery?.id as string | undefined;

      const { statusCode, responseBody, success } = await deliverWebhook(
        webhook.id,
        webhook.url,
        payload
      );

      if (deliveryId) {
        await db
          .from('cb_webhook_deliveries')
          .update({
            status_code: statusCode,
            response_body: responseBody,
            attempt_count: 3,
            delivered_at: success ? new Date().toISOString() : null,
            failed_at: success ? null : new Date().toISOString(),
          })
          .eq('id', deliveryId);
      }
    })
  );
}

// ---------------------------------------------------------------------------
// MCP tool calling
// ---------------------------------------------------------------------------

type McpTool = {
  name: string;
  description?: string;
  input_schema: Record<string, unknown>;
};

async function fetchMcpTools(server: McpServer): Promise<McpTool[]> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (server.auth_header) headers['Authorization'] = server.auth_header;

    const res = await fetch(server.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ jsonrpc: '2.0', method: 'tools/list', params: {}, id: 1 }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data?.result?.tools ?? []) as McpTool[];
  } catch {
    return [];
  }
}

async function callMcpTool(
  server: McpServer,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<string> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (server.auth_header) headers['Authorization'] = server.auth_header;

    const res = await fetch(server.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: { name: toolName, arguments: toolArgs },
        id: 2,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return `Error: HTTP ${res.status}`;
    const data = await res.json();
    const content = data?.result?.content;
    if (Array.isArray(content)) {
      return content
        .map((c: { type?: string; text?: string }) => (c.type === 'text' ? c.text : JSON.stringify(c)))
        .join('\n');
    }
    return JSON.stringify(data?.result ?? data);
  } catch (err) {
    return `Error calling tool: ${err instanceof Error ? err.message : String(err)}`;
  }
}

// ---------------------------------------------------------------------------
// Main chat stream
// ---------------------------------------------------------------------------

export async function createChatStream(
  chatbotId: string,
  sessionId: string,
  userMessage: string
): Promise<ReadableStream<Uint8Array>> {
  // 1. Get chatbot
  const chatbot = await getChatbot(chatbotId);
  if (!chatbot) {
    throw new Error(`Chatbot not found: ${chatbotId}`);
  }

  // 2. Embed user message
  const [queryEmbedding] = await embed([userMessage]);

  // 3. Search similar chunks
  const similarChunks = await searchSimilarChunks(chatbotId, queryEmbedding);

  // 4. Determine escalation
  const maxSimilarity =
    similarChunks.length > 0
      ? Math.max(...similarChunks.map((c) => c.similarity))
      : 0;
  const escalated = maxSimilarity < ESCALATION_THRESHOLD;

  // 5. Build system prompt with context
  const contextBlock =
    similarChunks.length > 0
      ? '\n\nRelevant context from knowledge base:\n' +
        similarChunks
          .map((c, i) => `[${i + 1}] ${c.content}`)
          .join('\n\n---\n\n')
      : '';

  const systemPrompt =
    (chatbot.system_prompt || 'You are a helpful assistant.') + contextBlock;

  // 6. Get or create conversation
  const supabase = getServiceClient();

  const { data: existingConversation } = await supabase
    .from('cb_conversations')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .eq('session_id', sessionId)
    .single();

  let conversationId: string;
  let isNewConversation = false;

  if (existingConversation) {
    conversationId = existingConversation.id as string;
    await supabase
      .from('cb_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  } else {
    const { data: newConversation, error: convError } = await supabase
      .from('cb_conversations')
      .insert({
        chatbot_id: chatbotId,
        session_id: sessionId,
        user_id: null,
      })
      .select('id')
      .single();

    if (convError || !newConversation) {
      throw new Error(
        `Failed to create conversation: ${convError?.message ?? 'unknown'}`
      );
    }
    conversationId = newConversation.id as string;
    isNewConversation = true;
  }

  // 7. Fetch last N conversation turns for history
  const { data: turnsData } = await supabase
    .from('cb_conversation_turns')
    .select('user_message, assistant_message')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_TURNS);

  const recentTurns = (
    (turnsData ?? []) as Pick<ConversationTurn, 'user_message' | 'assistant_message'>[]
  ).reverse();

  const messages: Anthropic.MessageParam[] = [];
  for (const turn of recentTurns) {
    messages.push({ role: 'user', content: turn.user_message });
    messages.push({ role: 'assistant', content: turn.assistant_message });
  }
  messages.push({ role: 'user', content: userMessage });

  // 8. Resolve MCP tools
  const mcpServers: McpServer[] = chatbot.mcp_servers ?? [];
  const allMcpTools: Array<{ tool: McpTool; server: McpServer }> = [];

  if (mcpServers.length > 0) {
    const toolResults = await Promise.allSettled(
      mcpServers.map(async (server) => {
        const tools = await fetchMcpTools(server);
        return { server, tools };
      })
    );
    for (const result of toolResults) {
      if (result.status === 'fulfilled') {
        for (const tool of result.value.tools) {
          allMcpTools.push({ tool, server: result.value.server });
        }
      }
    }
  }

  const anthropicTools: Anthropic.Tool[] = allMcpTools.map(({ tool }) => ({
    name: tool.name,
    description: tool.description ?? '',
    input_schema: tool.input_schema as Anthropic.Tool['input_schema'],
  }));

  // 9. Return a ReadableStream that streams the Anthropic response as SSE
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullAssistantMessage = '';

      try {
        // If MCP tools are configured, do a non-streaming agentic loop first
        if (anthropicTools.length > 0) {
          const agentMessages: Anthropic.MessageParam[] = [...messages];

          // Agentic loop: keep calling until no more tool_use
          while (true) {
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-6',
              max_tokens: 4096,
              system: systemPrompt,
              messages: agentMessages,
              tools: anthropicTools,
            });

            const toolUseBlocks = response.content.filter(
              (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
            );

            if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
              // Collect text from the final non-tool response, then stream it
              const textContent = response.content
                .filter((b): b is Anthropic.TextBlock => b.type === 'text')
                .map((b) => b.text)
                .join('');

              fullAssistantMessage = textContent;

              // Stream the final text word-by-word for a streaming feel
              const words = textContent.split(/(\s+)/);
              for (const word of words) {
                if (word) {
                  controller.enqueue(sseEvent({ type: 'chunk', text: word }));
                }
              }
              break;
            }

            // Add assistant message with tool_use to history
            agentMessages.push({ role: 'assistant', content: response.content });

            // Execute all tool calls
            const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
              toolUseBlocks.map(async (toolUse) => {
                const mcpEntry = allMcpTools.find((t) => t.tool.name === toolUse.name);
                let result = 'Tool not found';
                if (mcpEntry) {
                  result = await callMcpTool(
                    mcpEntry.server,
                    toolUse.name,
                    toolUse.input as Record<string, unknown>
                  );
                }
                return {
                  type: 'tool_result' as const,
                  tool_use_id: toolUse.id,
                  content: result,
                };
              })
            );

            agentMessages.push({ role: 'user', content: toolResults });
          }
        } else {
          // No MCP tools — stream directly
          const anthropicStream = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1024,
            system: systemPrompt,
            messages,
          });

          for await (const event of anthropicStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text;
              fullAssistantMessage += text;
              controller.enqueue(sseEvent({ type: 'chunk', text }));
            }
          }
        }

        controller.enqueue(
          sseEvent({ type: 'done', conversationId, escalated })
        );
        controller.close();

        // 10. Save turn (best-effort)
        try {
          await supabase.from('cb_conversation_turns').insert({
            conversation_id: conversationId,
            user_message: userMessage,
            assistant_message: fullAssistantMessage,
            escalated,
            metadata: {
              similarity_scores: similarChunks.map((c) => c.similarity),
            },
          });
        } catch (saveErr) {
          console.warn('Failed to save conversation turn:', saveErr);
        }

        // 11. Fire webhooks in background
        const webhookPayloadBase = {
          chatbot_id: chatbotId,
          conversation_id: conversationId,
          message: userMessage,
          response: fullAssistantMessage,
          escalated,
          timestamp: new Date().toISOString(),
        };

        if (isNewConversation) {
          fireWebhooks(chatbotId, 'new_conversation', {
            event: 'new_conversation',
            ...webhookPayloadBase,
          }).catch(() => {});
        }

        fireWebhooks(chatbotId, 'new_message', {
          event: 'new_message',
          ...webhookPayloadBase,
        }).catch(() => {});

        if (escalated) {
          fireWebhooks(chatbotId, 'escalation', {
            event: 'escalation',
            ...webhookPayloadBase,
          }).catch(() => {});
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(sseEvent({ type: 'error', message }));
        controller.close();
      }
    },
  });

  return stream;
}
