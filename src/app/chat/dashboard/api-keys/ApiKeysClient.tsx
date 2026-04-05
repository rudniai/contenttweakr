'use client';

import { useState } from 'react';

type ApiKey = {
  id: string;
  prefix: string;
  name: string | null;
  created_at: string;
};

const PLACEHOLDER_KEY = 'cb_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export default function ApiKeysClient({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNewKeyValue(null);

    try {
      const res = await fetch('/api/chat/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create key');
      }

      const data = await res.json();
      setNewKeyValue(data.key);
      setKeys((prev) => [{ id: data.id, prefix: data.prefix, name: data.name, created_at: data.created_at }, ...prev]);
      setNewKeyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create key');
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    setRevoking(id);
    setError(null);

    try {
      const res = await fetch(`/api/chat/api-keys/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to revoke key');
      }
      setKeys((prev) => prev.filter((k) => k.id !== id));
      if (newKeyValue) setNewKeyValue(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke key');
    } finally {
      setRevoking(null);
    }
  }

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const displayKey = newKeyValue ?? PLACEHOLDER_KEY;

  return (
    <div className="space-y-6">
      {/* Create new key */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Key</h2>
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (optional)"
            disabled={creating}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={creating}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating && (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Generate Key
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {newKeyValue && (
          <div className="mt-4 p-4 bg-green-50 border border-green-300 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-2">
              Your new API key — copy it now, it will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white border border-green-200 rounded px-3 py-2 font-mono text-green-900 break-all">
                {newKeyValue}
              </code>
              <button
                onClick={() => handleCopy(newKeyValue)}
                className="px-3 py-2 text-xs font-medium border border-green-300 rounded-lg bg-white text-green-700 hover:bg-green-50 transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Existing keys */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Active Keys{' '}
            <span className="text-sm font-normal text-gray-400">({keys.length})</span>
          </h2>
        </div>

        {keys.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No active API keys. Generate one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {keys.map((key) => (
              <li key={key.id} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {key.name || 'Unnamed key'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <code className="text-xs text-gray-500 font-mono">{key.prefix}••••••••••••</code>
                    <span className="text-xs text-gray-400">
                      Created{' '}
                      {new Date(key.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRevoke(key.id)}
                  disabled={revoking === key.id}
                  className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {revoking === key.id ? 'Revoking...' : 'Revoke'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Usage examples */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage Examples</h2>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">curl</p>
            <pre className="text-xs bg-gray-900 text-green-400 rounded-lg p-4 overflow-x-auto">
              {`curl -X POST https://yourapp.com/api/chat/chat \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${displayKey}" \\
  -d '{"chatbot_id": "<chatbot_id>", "session_id": "sess_123", "message": "Hello"}'`}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">JavaScript</p>
            <pre className="text-xs bg-gray-900 text-blue-300 rounded-lg p-4 overflow-x-auto">
              {`const response = await fetch('https://yourapp.com/api/chat/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${displayKey}',
  },
  body: JSON.stringify({
    chatbot_id: '<chatbot_id>',
    session_id: 'sess_123',
    message: 'Hello',
  }),
});`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
