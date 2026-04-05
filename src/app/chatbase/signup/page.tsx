import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseSignupForm from './ChatbaseSignupForm';

export default async function ChatbaseSignupPage() {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — show signup form
  }

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseSignupForm />;
}
