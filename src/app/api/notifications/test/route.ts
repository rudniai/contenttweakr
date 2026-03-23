import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendOpportunityNotification } from '@/lib/email/send';
import { applyRateLimit } from '@/lib/ratelimit';

export async function POST() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(user.id, 'notifications:test', {
      maxRequests: 3,
      windowMs: 60 * 1000,
    });
    if (rateLimited) return rateLimited;

    if (!user.email) {
      return NextResponse.json({ error: 'No email address on your account' }, { status: 400 });
    }

    const sampleOpportunities = [
      {
        title: 'Looking for a content repurposing tool for my blog',
        subreddit: 'SaaS',
        url: 'https://reddit.com/r/SaaS/comments/example1',
        confidence: 92,
        context: 'I have a blog with 50+ articles and I want to repurpose them into social media posts, newsletters, and more. Any recommendations?',
      },
      {
        title: 'Best tools for turning blog posts into Twitter threads?',
        subreddit: 'ContentMarketing',
        url: 'https://reddit.com/r/ContentMarketing/comments/example2',
        confidence: 85,
        context: 'Looking for automation tools that can help me turn my long-form content into bite-sized social posts.',
      },
      {
        title: 'How do you repurpose your YouTube content?',
        subreddit: 'Entrepreneur',
        url: 'https://reddit.com/r/Entrepreneur/comments/example3',
        confidence: 78,
        context: 'I create weekly YouTube videos and want to maximize their reach by repurposing into other formats.',
      },
    ];

    const result = await sendOpportunityNotification(
      user.email,
      sampleOpportunities,
      'test-notification',
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
