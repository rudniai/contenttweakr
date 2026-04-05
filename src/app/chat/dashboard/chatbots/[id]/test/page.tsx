import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot } from '@/lib/chatbase/db';
import TestPanel from './TestPanel';

type Props = { params: Promise<{ id: string }> };

export default async function TestPage({ params }: Props) {
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

  return <TestPanel chatbot={chatbot} />;
}
