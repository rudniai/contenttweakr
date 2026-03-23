import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateResponseSchema } from "@/lib/validations/responses";
import { applyRateLimit, RATE_LIMITS } from "@/lib/ratelimit";

// --- Types ---

interface GenerateResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// --- AI generation ---

const anthropic = new Anthropic();

const MODEL_MAP: Record<string, string> = {
  sonnet: process.env.AI_MODEL || "claude-sonnet-4-20250514",
  opus: "claude-opus-4-20250514",
};

function getModelId(model: string): string {
  const resolved = MODEL_MAP[model] || MODEL_MAP.sonnet;
  console.log(`[generate-response] Using model: ${model} -> ${resolved}`);
  return resolved;
}

// --- Humanizer post-processing ---

function humanizeText(text: string): string {
  let result = text;

  // Remove any leftover markdown
  result = result.replace(/\*\*/g, "").replace(/\*/g, "").replace(/^[-•]\s/gm, "");

  // Randomly lowercase some sentence starts (~20% chance)
  result = result.replace(/(?<=\.\s+)([A-Z])/g, (match) => {
    return Math.random() < 0.2 ? match.toLowerCase() : match;
  });

  // Occasionally drop trailing periods on last sentence (~30% chance)
  if (Math.random() < 0.3) {
    result = result.replace(/\.\s*$/, "");
  }

  // Sometimes replace "do not" with "don't", "cannot" with "can't" etc
  result = result.replace(/\bdo not\b/gi, "don't");
  result = result.replace(/\bcannot\b/gi, "can't");
  result = result.replace(/\bwill not\b/gi, "won't");
  result = result.replace(/\bit is\b/gi, "it's");
  result = result.replace(/\bthat is\b/gi, "that's");

  // Remove AI-tell words if they slipped through
  const aiWords = ["comprehensive", "utilize", "leverage", "delve", "facilitate", "furthermore", "moreover", "subsequently", "aforementioned", "streamline"];
  for (const word of aiWords) {
    result = result.replace(new RegExp(`\\b${word}\\b`, "gi"), "");
  }

  // Clean up double spaces from removals
  result = result.replace(/\s{2,}/g, " ").trim();

  return result;
}

// --- System prompt builder ---

function buildSystemPrompt(sub: string, title: string, context: string): string {
  return `You're a real person on reddit. You type like you talk. You're commenting on a post in r/${sub}.

The post: "${title}"
${context ? `More context: ${context}` : ""}

Rules (follow these strictly):
- 2-3 sentences max. occasionally 4 if you really need it
- Write like you're texting a friend who asked for advice
- Use contractions always (don't, won't, can't, it's, that's)
- Casual slang is fine: tbh, ngl, imo, idk, lowkey, fr
- Fragments are good. Not everything needs to be a full sentence
- Vary sentence length a lot. Mix short punchy bits with one slightly longer thought
- Sometimes start mid-thought like "yeah so" or "honestly" or just dive in
- NEVER use bullet points, numbered lists, or any structured formatting
- NEVER use words like: comprehensive, utilize, leverage, delve, facilitate, furthermore, moreover, streamline, enhance, optimal
- NEVER use em-dashes (—)
- No markdown whatsoever
- Sound like you've personally dealt with this before
- Don't be overly enthusiastic or positive. Real people are measured
- Only mention freesiteaudit.com if genuinely relevant to site audits/performance and even then keep it super casual like "i used freesiteaudit.com for that"
- No greeting, no sign-off, no "hope this helps"
- Start your reply directly as if you're mid-conversation

Here are examples of the tone and style you should match:

Example 1: "honestly i had the same issue last month. ended up just switching to postgres and it fixed everything lol"

Example 2: "tbh the docs are kinda misleading on that. what worked for me was setting the env var before running the build, not after"

Example 3: "yeah that's a known thing with nextjs 14. downgrade to 14.1.0 and it should work, they broke something in .2"`;
}

async function generateResponse(
  title: string,
  context: string,
  subreddit: string,
  model: string = "sonnet"
): Promise<string> {
  const sub = subreddit.replace(/^r\//, "");
  const systemPrompt = buildSystemPrompt(sub, title, context);
  const modelId = getModelId(model);

  try {
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 250,
      temperature: 0.95,
      messages: [
        {
          role: "user",
          content: "Write a reddit comment responding to this post. Remember: short, casual, from personal experience. No lists or formatting.",
        },
      ],
      system: systemPrompt,
    });

    const block = message.content[0];
    if (block.type === "text") {
      return humanizeText(block.text);
    }

    throw new Error("Unexpected response format from AI");
  } catch (err) {
    console.error(`[generate-response] Anthropic API error (model=${modelId}):`, err);
    throw err;
  }
}

// --- Route handler ---

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse> | NextResponse> {
  try {
    // 1. Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const rateLimited = applyRateLimit(user.id, 'generate-response', RATE_LIMITS.generateResponse);
    if (rateLimited) return rateLimited;

    // 2. Parse and validate input
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = generateResponseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, context, subreddit, opportunityUrl, model } = parsed.data;

    // 3. Generate response via AI
    const text = await generateResponse(title, context, subreddit, model);

    // 4. Save response to DB if we can find the opportunity
    let responseId: string | undefined;
    if (opportunityUrl) {
      const { data: opp } = await supabase
        .from("opportunities")
        .select("id")
        .eq("user_id", user.id)
        .eq("url", opportunityUrl)
        .single();

      if (opp) {
        const { data: saved, error: saveError } = await supabase
          .from("generated_responses")
          .insert({
            opportunity_id: opp.id,
            user_id: user.id,
            response_text: text,
            model,
          })
          .select("id")
          .single();

        if (saveError) {
          console.error("Error saving response to DB:", saveError);
        } else {
          responseId = saved?.id;
        }
      }
    }

    // 5. Return
    return NextResponse.json({
      success: true,
      response: text,
      model,
      responseId,
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("[generate-response] Unexpected error:", errMsg, error);
    return NextResponse.json(
      { success: false, error: `Generation failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
