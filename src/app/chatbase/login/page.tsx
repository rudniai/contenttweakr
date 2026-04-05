import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatbaseLoginForm from './ChatbaseLoginForm';

export default async function ChatbaseLoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect('/chatbase/dashboard');

  return <ChatbaseLoginForm />;
}
