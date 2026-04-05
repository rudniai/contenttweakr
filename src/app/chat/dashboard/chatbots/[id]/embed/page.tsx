import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot, getUserPlanLimits } from '@/lib/chatbase/db';
import EmbedClient from './EmbedClient';

type Props = { params: Promise<{ id: string }> };

export default async function EmbedPage({ params }: Props) {
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

  let isPaidPlan = false;
  try {
    const plan = await getUserPlanLimits(user.id);
    isPaidPlan = plan != null && plan.price_monthly_cents > 0;
  } catch {
    // default to free
  }

  return <EmbedClient chatbot={chatbot} isPaidPlan={isPaidPlan} />;
}
