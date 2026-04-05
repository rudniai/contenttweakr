import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot, getServiceClient } from '@/lib/chatbase/db';
import WebhooksClient from './WebhooksClient';
import type { Webhook } from '@/lib/chatbase/db';

type Props = { params: Promise<{ id: string }> };

export default async function WebhooksPage({ params }: Props) {
  const { id } = await params;

  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // ignore
  }

  if (!user) redirect('/chat/login');

  let chatbot;
  try {
    chatbot = await getChatbot(id, user.id);
  } catch {
    chatbot = null;
  }
  if (!chatbot) notFound();

  let webhooks: Webhook[] = [];
  try {
    const db = getServiceClient();
    const { data } = await db
      .from('cb_webhooks')
      .select('*')
      .eq('chatbot_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    webhooks = (data ?? []) as Webhook[];
  } catch (err) {
    console.error('[webhooks page] fetch error:', err);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Webhooks</h2>
        <p className="text-sm text-gray-500 mt-1">
          Receive real-time event notifications when conversations occur.
        </p>
      </div>
      <WebhooksClient chatbotId={id} initialWebhooks={webhooks} />
    </div>
  );
}
