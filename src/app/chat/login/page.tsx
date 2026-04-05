import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseLoginForm from './ChatbaseLoginForm';

export default async function ChatbaseLoginPage() {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — show login form
  }

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseLoginForm />;
}
