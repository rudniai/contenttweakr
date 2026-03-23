'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  days: number;
  total: number;
  responseCount: number;
  replied: number;
  avgConfidence: number;
  platformCounts: Record<string, number>;
  topSubreddits: [string, number][];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-2xl font-semibold text-white mt-1">{value}</p>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-300 w-32 truncate shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 bg-slate-700/50 rounded-full h-5 overflow-hidden">
        <div
          className="bg-blue-500 h-full rounded-full transition-all"
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
      <span className="text-sm text-slate-400 w-10 text-right shrink-0">{value}</span>
    </div>
  );
}

const PLATFORM_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  hackernews: 'Hacker News',
  producthunt: 'Product Hunt',
};

export function AnalyticsDashboard({
  days,
  total,
  responseCount,
  replied,
  avgConfidence,
  platformCounts,
  topSubreddits,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setDays(d: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('days', String(d));
    router.push(`/dashboard/analytics?${params.toString()}`);
  }

  const maxSubredditCount = topSubreddits.length > 0 ? topSubreddits[0][1] : 0;
  const maxPlatformCount = Math.max(...Object.values(platformCounts), 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-white">Analytics</h1>
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700/50">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Opportunities" value={total} />
          <StatCard label="Responses Generated" value={responseCount} />
          <StatCard label="Replied" value={replied} />
          <StatCard label="Avg Confidence" value={`${avgConfidence}%`} />
        </div>

        {/* Platform breakdown */}
        <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50 mb-6">
          <h2 className="text-sm font-medium text-slate-300 mb-4">By Platform</h2>
          {Object.keys(platformCounts).length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(platformCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => (
                  <Bar
                    key={platform}
                    label={PLATFORM_LABELS[platform] ?? platform}
                    value={count}
                    max={maxPlatformCount}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Subreddit breakdown */}
        <div className="bg-slate-800/30 rounded-lg p-6 border border-slate-700/50">
          <h2 className="text-sm font-medium text-slate-300 mb-4">Top Subreddits / Sources</h2>
          {topSubreddits.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <div className="space-y-3">
              {topSubreddits.map(([name, count]) => (
                <Bar key={name} label={name} value={count} max={maxSubredditCount} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
