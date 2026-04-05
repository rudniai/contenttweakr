import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseSignupForm from './ChatbaseSignupForm';

export default async function ChatbaseSignupPage() {
  const supabase = createChatbaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseSignupForm />;
}
