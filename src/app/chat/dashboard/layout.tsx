import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseSidebar from './ChatbaseSidebar';

export default async function ChatbaseDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Auth error — treat as unauthenticated
  }

  if (!user) {
    redirect('/chat/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ChatbaseSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
