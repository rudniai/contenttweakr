import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseLoginForm from './ChatbaseLoginForm';

export default async function ChatbaseLoginPage() {
  const supabase = createChatbaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseLoginForm />;
}
