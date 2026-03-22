import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Load saved opportunities with their responses from DB
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const scanId = searchParams.get('scan_id');

    // Fetch opportunities with their latest response
    let query = supabase
      .from('opportunities')
      .select(`
        id,
        subreddit,
        title,
        url,
        context,
        confidence,
        upvotes,
        comments,
        scanned_at,
        hidden,
        replied_at,
        generated_responses (
          id,
          response_text,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('scanned_at', { ascending: false })
      .limit(50);

    if (scanId) {
      query = query.eq('scan_id', scanId);
    }

    if (!includeHidden) {
      query = query.or('hidden.is.null,hidden.eq.false');
    }

    const { data: opportunities, error } = await query;

    if (error) {
      console.error('Error loading opportunities:', error);
      return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 });
    }

    // Transform to match frontend Opportunity interface
    const formatted = (opportunities || []).map((opp) => ({
      id: opp.id,
      subreddit: opp.subreddit,
      title: opp.title,
      url: opp.url,
      context: opp.context || '',
      confidence: opp.confidence,
      upvotes: opp.upvotes,
      comments: opp.comments,
      date: opp.scanned_at,
      hidden: opp.hidden || false,
      repliedAt: opp.replied_at || null,
      aiResponse: opp.generated_responses?.[0]?.response_text || undefined,
    }));

    return NextResponse.json({ success: true, opportunities: formatted });
  } catch (error) {
    console.error('Load opportunities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
