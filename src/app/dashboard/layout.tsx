import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Nav */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex space-x-8">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-900 border-b-2 border-transparent hover:border-slate-300"
              >
                Content Repurposer
              </Link>
              <Link
                href="/dashboard/reddit-finder"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-slate-700 border-b-2 border-transparent hover:border-slate-300"
              >
                🔍 Reddit Finder
              </Link>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-slate-600">ContentTweakr</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main>{children}</main>
    </div>
  );
}
