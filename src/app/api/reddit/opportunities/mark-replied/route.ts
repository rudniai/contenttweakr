import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { markRepliedSchema } from '@/lib/validations/opportunities';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = markRepliedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { opportunityId } = parsed.data;

    const { error } = await supabase
      .from('opportunities')
      .update({ replied_at: new Date().toISOString() })
      .eq('id', opportunityId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error marking opportunity as replied:', error);
      return NextResponse.json({ error: 'Failed to mark as replied' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark replied error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
