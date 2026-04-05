import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient } from '@/lib/chatbase/db';
import ApiKeysClient from './ApiKeysClient';

type ApiKey = {
  id: string;
  prefix: string;
  name: string | null;
  created_at: string;
};

export default async function ApiKeysPage() {
  const supabase = createChatbaseServerClient();
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // treat as unauthenticated
  }

  if (!user) redirect('/chat/login');

  let apiKeys: ApiKey[] = [];
  try {
    const db = getServiceClient();
    const { data } = await db
      .from('cb_api_keys')
      .select('id, prefix, name, created_at')
      .eq('user_id', user.id)
      .is('revoked_at', null)
      .order('created_at', { ascending: false });
    apiKeys = (data ?? []) as ApiKey[];
  } catch (err) {
    console.error('[api-keys] page fetch error:', err);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
        <p className="text-sm text-gray-500 mt-1">
          Use API keys to authenticate programmatic access to your chatbots.
        </p>
      </div>
      <ApiKeysClient initialKeys={apiKeys} />
    </div>
  );
}
