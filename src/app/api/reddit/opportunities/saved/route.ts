import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Load saved opportunities with their responses from DB
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log('[saved] Auth check:', { userId: user?.id, authError: authError?.message });

    if (!user) {
      console.log('[saved] No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const scanId = searchParams.get('scan_id');

    console.log('[saved] Query params:', { includeHidden, scanId, userId: user.id });

    // First: raw count check to see if ANY opportunities exist for this user
    const { count, error: countError } = await supabase
      .from('opportunities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    console.log('[saved] Total opportunities for user:', { count, countError: countError?.message });

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
        platform,
        generated_responses (
          id,
          response_text,
          model,
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

    console.log('[saved] Query result:', {
      error: error?.message,
      count: opportunities?.length,
      firstTitle: opportunities?.[0]?.title,
      hiddenValues: opportunities?.map(o => o.hidden),
    });

    if (error) {
      console.error('[saved] Error loading opportunities:', error);
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
      platform: opp.platform || 'reddit',
      aiResponse: opp.generated_responses?.[0]?.response_text || undefined,
      aiResponseId: opp.generated_responses?.[0]?.id || undefined,
      aiResponseModel: opp.generated_responses?.[0]?.model || undefined,
    }));

    console.log('[saved] Returning', formatted.length, 'formatted opportunities');

    return NextResponse.json({ success: true, opportunities: formatted });
  } catch (error) {
    console.error('[saved] Load opportunities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
