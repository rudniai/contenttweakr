import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Anthropic from "@anthropic-ai/sdk";

// --- Types ---

interface GenerateRequest {
  title: string;
  context: string;
  subreddit: string;
  opportunityUrl?: string;
}

interface GenerateResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// --- AI generation ---

const anthropic = new Anthropic();

async function generateResponse(
  title: string,
  context: string,
  subreddit: string
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

  const message = await anthropic.messages.create({
    model: process.env.AI_MODEL || "claude-sonnet-4-5-20250514",
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
}

// --- Route handler ---

export async function POST(
  request: NextRequest
): Promise<NextResponse<GenerateResponse>> {
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

    // 2. Parse and validate input
    let body: GenerateRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { title, context, subreddit, opportunityUrl } = body;

    if (!title || !subreddit) {
      return NextResponse.json(
        { success: false, error: "title and subreddit are required" },
        { status: 400 }
      );
    }

    // 3. Generate response via AI
    const text = await generateResponse(title, context || "", subreddit);

    // 4. Save response to DB if we can find the opportunity
    if (opportunityUrl) {
      const { data: opp } = await supabase
        .from("opportunities")
        .select("id")
        .eq("user_id", user.id)
        .eq("url", opportunityUrl)
        .single();

      if (opp) {
        const { error: saveError } = await supabase
          .from("generated_responses")
          .insert({
            opportunity_id: opp.id,
            user_id: user.id,
            response_text: text,
          });

        if (saveError) {
          console.error("Error saving response to DB:", saveError);
        }
      }
    }

    // 5. Return
    return NextResponse.json({
      success: true,
      response: text,
    });
  } catch (error) {
    console.error("[generate-response] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
