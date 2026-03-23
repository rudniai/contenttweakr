import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateSettingsSchema } from '@/lib/validations/settings';
import { SUBREDDITS, KEYWORDS } from '@/lib/reddit/config';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('subreddits, keywords, scan_frequency')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    return NextResponse.json({
      subreddits: data?.subreddits ?? SUBREDDITS,
      keywords: data?.keywords ?? KEYWORDS,
      scan_frequency: data?.scan_frequency ?? 'disabled',
      isCustom: {
        subreddits: data?.subreddits != null,
        keywords: data?.keywords != null,
      },
    });
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { subreddits, keywords, scan_frequency } = parsed.data;

    const upsertData: Record<string, unknown> = {
      user_id: user.id,
      subreddits,
      keywords,
    };
    if (scan_frequency !== undefined) {
      upsertData.scan_frequency = scan_frequency;
    }

    const { error } = await supabase
      .from('user_settings')
      .upsert(upsertData, { onConflict: 'user_id' });

    if (error) {
      console.error('Error saving settings:', error);
      return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
