import { notFound, redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getChatbot, getServiceClient, type Document } from '@/lib/chatbase/db';
import DocumentsClient from './DocumentsClient';

type Props = { params: Promise<{ id: string }> };

export default async function DocumentsPage({ params }: Props) {
  const { id } = await params;

  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — treat as unauthenticated
  }

  if (!user) redirect('/chat/login');

  let chatbot;
  try {
    chatbot = await getChatbot(id, user.id);
  } catch (err) {
    console.error('[chatbase/documents] getChatbot error:', err);
    chatbot = null;
  }
  if (!chatbot) notFound();

  const db = getServiceClient();
  const { data: documents } = await db
    .from('cb_documents')
    .select('*')
    .eq('chatbot_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <DocumentsClient
      chatbotId={id}
      initialDocuments={(documents ?? []) as Document[]}
    />
  );
}
