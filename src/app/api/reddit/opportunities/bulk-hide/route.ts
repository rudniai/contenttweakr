import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkHideSchema } from '@/lib/validations/opportunities';
import { applyRateLimit, RATE_LIMITS } from '@/lib/ratelimit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = applyRateLimit(user.id, 'bulk-operation', RATE_LIMITS.bulkOperation);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const parsed = bulkHideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { opportunityIds, hidden } = parsed.data;

    const { error } = await supabase
      .from('opportunities')
      .update({ hidden })
      .in('id', opportunityIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error bulk hiding opportunities:', error);
      return NextResponse.json({ error: 'Failed to update opportunities' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk hide error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
