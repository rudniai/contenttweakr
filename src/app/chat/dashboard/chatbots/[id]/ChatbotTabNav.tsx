'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { label: 'Settings', suffix: '' },
  { label: 'Documents', suffix: '/documents' },
  { label: 'Conversations', suffix: '/conversations' },
  { label: 'Embed', suffix: '/embed' },
  { label: 'Test', suffix: '/test' },
  { label: 'Webhooks', suffix: '/webhooks' },
  { label: 'Connections', suffix: '/connections' },
];

export default function ChatbotTabNav({ chatbotId }: { chatbotId: string }) {
  const pathname = usePathname();
  const base = `/chat/dashboard/chatbots/${chatbotId}`;

  return (
    <nav className="flex border-b border-gray-200 gap-1 -mb-px">
      {tabs.map((tab) => {
        const href = `${base}${tab.suffix}`;
        const isActive = tab.suffix === ''
          ? pathname === base
          : pathname.startsWith(href);
        return (
          <Link
            key={tab.suffix}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              isActive
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
