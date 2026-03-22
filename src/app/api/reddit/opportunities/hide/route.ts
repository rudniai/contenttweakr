import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hideOpportunitySchema } from '@/lib/validations/opportunities';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = hideOpportunitySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { opportunityId, hidden } = parsed.data;

    const { error } = await supabase
      .from('opportunities')
      .update({ hidden })
      .eq('id', opportunityId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating opportunity hidden status:', error);
      return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hide opportunity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
