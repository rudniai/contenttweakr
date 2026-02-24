import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

const PLATFORM_PROMPTS: Record<string, string> = {
  twitter: 'Repurpose this content for Twitter/X. Make it concise (under 280 characters), engaging, and include relevant hashtags. Focus on the key takeaway.',
  linkedin: 'Repurpose this content for LinkedIn. Write a professional post (200-300 words) that provides value, tells a story, and encourages engagement. Use line breaks for readability.',
  instagram: 'Repurpose this content for Instagram. Create an engaging caption (150-200 words) that\'s conversational, includes emojis, and ends with a call-to-action. Include relevant hashtags at the end.',
  email: 'Repurpose this content for an email newsletter. Create a compelling subject line and body (300-400 words) that\'s informative, engaging, and includes a clear call-to-action.',
  reddit: 'Repurpose this content for Reddit. Write an authentic, detailed post (300-400 words) that provides value to the community. Be conversational, helpful, and avoid being overly promotional.',
};

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, platforms } = await request.json();

    if (!content || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Content and platforms are required' },
        { status: 400 }
      );
    }

    // Check usage limits
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData } = await supabase
      .from('usage_tracking')
      .select('count, is_pro')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const currentCount = usageData?.count || 0;
    const isPro = usageData?.is_pro || false;

    if (!isPro && currentCount >= 5) {
      return NextResponse.json(
        { error: 'Daily limit reached. Upgrade to Pro for unlimited access.' },
        { status: 429 }
      );
    }

    // Repurpose content for each platform
    const openai = getOpenAIClient();
    const results = await Promise.all(
      platforms.map(async (platform: string) => {
        const prompt = PLATFORM_PROMPTS[platform];
        if (!prompt) {
          return { platform, content: 'Unsupported platform' };
        }

        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a content repurposing expert. Transform content for different social media platforms while maintaining the core message and value.',
              },
              {
                role: 'user',
                content: `${prompt}\n\nOriginal content:\n${content}`,
              },
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          return {
            platform,
            content: completion.choices[0]?.message?.content || 'Failed to generate content',
          };
        } catch (error) {
          console.error(`Error repurposing for ${platform}:`, error);
          return {
            platform,
            content: 'Error generating content for this platform',
          };
        }
      })
    );

    // Update usage tracking
    if (usageData) {
      await supabase
        .from('usage_tracking')
        .update({ count: currentCount + 1 })
        .eq('user_id', user.id)
        .eq('date', today);
    } else {
      await supabase
        .from('usage_tracking')
        .insert({
          user_id: user.id,
          date: today,
          count: 1,
          is_pro: false,
        });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Repurpose API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
