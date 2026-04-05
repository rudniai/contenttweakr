'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Chatbot, Conversation } from '@/lib/chatbase/db';

type ConvRow = Conversation & { chatbot_name: string; message_count: number; escalated: boolean };

export default function ConversationsClient({
  conversations,
  chatbots,
}: {
  conversations: ConvRow[];
  chatbots: Chatbot[];
}) {
  const [search, setSearch] = useState('');
  const [filterChatbot, setFilterChatbot] = useState('');
  const [filterEscalated, setFilterEscalated] = useState<'all' | 'yes' | 'no'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Record<string, { user_message: string; assistant_message: string; escalated: boolean; created_at: string }[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (filterChatbot && c.chatbot_id !== filterChatbot) return false;
      if (filterEscalated === 'yes' && !c.escalated) return false;
      if (filterEscalated === 'no' && c.escalated) return false;
      if (search && !c.session_id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [conversations, filterChatbot, filterEscalated, search]);

  async function handleExpand(convId: string) {
    if (expandedId === convId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(convId);
    if (turns[convId]) return;
    setLoadingId(convId);
    try {
      const res = await fetch(`/api/chat/conversations/${convId}/turns`);
      if (res.ok) {
        const data = await res.json();
        setTurns((prev) => ({ ...prev, [convId]: data.turns }));
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
        <p className="text-sm text-gray-500 mt-1">
          All conversations across your chatbots
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          placeholder="Search session ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-52"
        />
        <select
          value={filterChatbot}
          onChange={(e) => setFilterChatbot(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All chatbots</option>
          {chatbots.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterEscalated}
          onChange={(e) => setFilterEscalated(e.target.value as 'all' | 'yes' | 'no')}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All escalation</option>
          <option value="yes">Escalated</option>
          <option value="no">Not escalated</option>
        </select>
        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {conversations.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
              className="w-10 h-10 text-gray-300 mx-auto mb-3">
              <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-gray-500">No conversations yet.</p>
            <p className="text-xs text-gray-400 mt-1">Conversations will appear here once users start chatting.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No conversations match your filters.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_160px_80px_100px_48px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Session ID</span>
              <span>Chatbot</span>
              <span>Messages</span>
              <span>Last Active</span>
              <span></span>
            </div>
            <ul className="divide-y divide-gray-100">
              {filtered.map((conv) => (
                <li key={conv.id}>
                  <div
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_160px_80px_100px_48px] gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer items-center"
                    onClick={() => handleExpand(conv.id)}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      {conv.escalated && (
                        <span className="flex-shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                          Escalated
                        </span>
                      )}
                      <span className="text-sm font-mono text-gray-700 truncate">{conv.session_id}</span>
                    </div>
                    <div className="hidden sm:block text-sm text-gray-500 truncate">
                      <Link
                        href={`/chat/dashboard/chatbots/${conv.chatbot_id}/conversations`}
                        className="hover:text-indigo-600 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {conv.chatbot_name}
                      </Link>
                    </div>
                    <div className="hidden sm:block text-sm text-gray-500">{conv.message_count}</div>
                    <div className="hidden sm:block text-xs text-gray-400">
                      {new Date(conv.updated_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </div>
                    <div className="flex justify-end">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === conv.id ? 'rotate-180' : ''}`}
                      >
                        <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  {expandedId === conv.id && (
                    <div className="bg-gray-50 border-t border-gray-100 px-5 py-4">
                      {loadingId === conv.id ? (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="h-4 w-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Loading transcript...
                        </div>
                      ) : !turns[conv.id] || turns[conv.id].length === 0 ? (
                        <p className="text-sm text-gray-400">No messages in this conversation.</p>
                      ) : (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {turns[conv.id].map((turn, i) => (
                            <div key={i} className="space-y-1.5">
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 text-xs font-medium text-indigo-600 w-16 pt-0.5">User</span>
                                <p className="text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-200 flex-1">{turn.user_message}</p>
                              </div>
                              <div className="flex items-start gap-2">
                                <span className="flex-shrink-0 text-xs font-medium text-green-600 w-16 pt-0.5">Bot</span>
                                <p className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100 flex-1 whitespace-pre-wrap">{turn.assistant_message}</p>
                              </div>
                              {turn.escalated && (
                                <div className="ml-16">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                                    Bot did not know the answer
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
