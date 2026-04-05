import Anthropic from '@anthropic-ai/sdk';
import {
  getChatbot,
  searchSimilarChunks,
  getServiceClient,
  type ConversationTurn,
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

  if (existingConversation) {
    conversationId = existingConversation.id as string;
    // Touch updated_at
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
  }

  // 7. Fetch last N conversation turns for history
  const { data: turnsData } = await supabase
    .from('cb_conversation_turns')
    .select('user_message, assistant_message')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(HISTORY_TURNS);

  const recentTurns = ((turnsData ?? []) as Pick<ConversationTurn, 'user_message' | 'assistant_message'>[]).reverse();

  // Build message history
  const messages: Anthropic.MessageParam[] = [];
  for (const turn of recentTurns) {
    messages.push({ role: 'user', content: turn.user_message });
    messages.push({ role: 'assistant', content: turn.assistant_message });
  }
  messages.push({ role: 'user', content: userMessage });

  // 8. Return a ReadableStream that streams the Anthropic response as SSE
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullAssistantMessage = '';

      try {
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

        // Done event
        controller.enqueue(
          sseEvent({ type: 'done', conversationId, escalated })
        );
        controller.close();

        // 9. Save turn (best-effort — do not throw on failure)
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
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        controller.enqueue(sseEvent({ type: 'error', message }));
        controller.close();
      }
    },
  });

  return stream;
}
