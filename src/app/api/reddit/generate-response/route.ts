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

async function generateResponse(
  title: string,
  context: string,
  subreddit: string,
  model: string = "sonnet"
): Promise<string> {
  const sub = subreddit.replace(/^r\//, "");

  const systemPrompt = `You are a helpful Reddit user responding naturally to posts/comments.

Context: This is from r/${sub}
Post/Comment: ${title}
${context ? `Additional context: ${context}` : ""}

Guidelines:
- Write naturally like a real Reddit user (casual, lowercase, contractions)
- NO em-dashes (AI tell)
- Only mention freesiteaudit.com if genuinely relevant (site audits, performance checks)
- Keep it concise (2-4 sentences max)
- Be helpful first, promotional never
- Match the subreddit tone
- Do not use markdown formatting
- Start your response directly, no greeting or preamble`;

  const modelId = getModelId(model);

  try {
    const message = await anthropic.messages.create({
      model: modelId,
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: "Generate a helpful response to this Reddit post/comment.",
        },
      ],
      system: systemPrompt,
    });

    const block = message.content[0];
    if (block.type === "text") {
      return block.text;
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
