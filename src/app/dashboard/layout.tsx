'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/dashboard/reddit-finder', label: 'Scanner' },
  { href: '/dashboard/history', label: 'Scan History' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-8">
          <div className="flex items-center gap-6 h-12">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-white border-b-2 border-blue-500 pb-[13px] pt-[15px]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
