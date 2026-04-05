'use client';

import { useState } from 'react';
import type { McpServer } from '@/lib/chatbase/db';

export default function ConnectionsClient({
  chatbotId,
  initialServers,
}: {
  chatbotId: string;
  initialServers: McpServer[];
}) {
  const [servers, setServers] = useState<McpServer[]>(initialServers);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [authHeader, setAuthHeader] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function saveServers(updated: McpServer[]) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/chat/chatbots/${chatbotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mcp_servers: updated }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }

      const data = await res.json();
      setServers(data.mcp_servers ?? updated);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    const newServer: McpServer = {
      url: trimmedUrl,
      name: name.trim() || undefined,
      auth_header: authHeader.trim() || undefined,
    };

    const updated = [...servers, newServer];
    const ok = await saveServers(updated);
    if (ok) {
      setName('');
      setUrl('');
      setAuthHeader('');
      setSuccess('MCP server added.');
    }
  }

  async function handleRemove(index: number) {
    if (!confirm('Remove this MCP server connection?')) return;
    const updated = servers.filter((_, i) => i !== index);
    const ok = await saveServers(updated);
    if (ok) setSuccess('MCP server removed.');
  }

  return (
    <div className="space-y-6">
      {/* Add form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add MCP Server</h3>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Tools Server"
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Server URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://my-mcp-server.com/mcp"
              disabled={saving}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Auth Header <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={authHeader}
              onChange={(e) => setAuthHeader(e.target.value)}
              placeholder="Bearer your-token-here"
              disabled={saving}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !url.trim()}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Add Connection
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            {success}
          </div>
        )}
      </div>

      {/* Server list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Connections{' '}
            <span className="text-sm font-normal text-gray-400">({servers.length})</span>
          </h3>
        </div>

        {servers.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No MCP servers connected. Add one above.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {servers.map((server, index) => (
              <li key={index} className="px-6 py-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {server.name || server.url}
                  </p>
                  {server.name && (
                    <p className="text-xs text-gray-500 font-mono truncate mt-0.5">
                      {server.url}
                    </p>
                  )}
                  {server.auth_header && (
                    <p className="text-xs text-gray-400 mt-0.5">Auth header configured</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemove(index)}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
