'use client';

import Link from 'next/link';
import type { Chatbot } from '@/lib/chatbase/db';

export default function ChatbotList({ chatbots }: { chatbots: Chatbot[] }) {
  if (chatbots.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {chatbots.map((bot) => (
        <Link
          key={bot.id}
          href={`/chatbase/dashboard/chatbots/${bot.id}`}
          className="group block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: bot.primary_color ?? '#6366f1' }}
            >
              {(bot.name ?? '?').charAt(0).toUpperCase()}
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors"
            >
              <path
                fillRule="evenodd"
                d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-gray-900 truncate">
            {bot.name}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Created{' '}
            {new Date(bot.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <div className="mt-3 flex gap-3">
            <span
              role="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/chatbase/dashboard/chatbots/${bot.id}/documents`;
              }}
              className="text-xs text-indigo-600 hover:underline cursor-pointer"
            >
              Documents
            </span>
            <span
              role="link"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = `/chatbase/dashboard/chatbots/${bot.id}/conversations`;
              }}
              className="text-xs text-indigo-600 hover:underline cursor-pointer"
            >
              Conversations
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
