import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { bulkRepliedSchema } from '@/lib/validations/opportunities';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bulkRepliedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { opportunityIds } = parsed.data;

    const { error } = await supabase
      .from('opportunities')
      .update({ replied_at: new Date().toISOString() })
      .in('id', opportunityIds)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error bulk marking as replied:', error);
      return NextResponse.json({ error: 'Failed to mark as replied' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Bulk replied error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
