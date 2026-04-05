import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient, getChatbot } from '@/lib/chatbase/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    // Verify chatbot belongs to user
    const chatbot = await getChatbot(id, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_documents')
      .select('*')
      .eq('chatbot_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[chatbots/[id]/documents] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[chatbots/[id]/documents] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
