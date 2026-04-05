import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatbaseSignupForm from './ChatbaseSignupForm';

export default async function ChatbaseSignupPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseSignupForm />;
}
