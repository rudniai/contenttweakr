import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatbaseSidebar from './ChatbaseSidebar';

export default async function ChatbaseDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
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
