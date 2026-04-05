import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getChatbot, getServiceClient, type Document } from '@/lib/chatbase/db';
import DocumentsClient from './DocumentsClient';

type Props = { params: Promise<{ id: string }> };

export default async function DocumentsPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const chatbot = await getChatbot(id, user.id);
  if (!chatbot) notFound();

  const db = getServiceClient();
  const { data: documents } = await db
    .from('cb_documents')
    .select('*')
    .eq('chatbot_id', id)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/chatbase" className="hover:text-indigo-600 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href={`/chatbase/chatbots/${id}`}
          className="hover:text-indigo-600 transition-colors truncate max-w-xs"
        >
          {chatbot.name}
        </Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Documents</span>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
      </div>

      <DocumentsClient
        chatbotId={id}
        initialDocuments={(documents ?? []) as Document[]}
      />
    </div>
  );
}
