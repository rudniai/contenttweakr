import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import ChatbaseSidebar from './ChatbaseSidebar';

export default async function ChatbaseDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createChatbaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/chatbase/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ChatbaseSidebar userEmail={user.email ?? ''} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
