'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ScanRecord {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  hours: number;
  result_count: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

function StatusBadge({ status }: { status: ScanRecord['status'] }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-900/50 text-emerald-300 border-emerald-700/30',
    failed: 'bg-red-900/50 text-red-300 border-red-700/30',
    processing: 'bg-amber-900/50 text-amber-300 border-amber-700/30',
    pending: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
      {status === 'processing' && (
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse mr-1.5" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function formatDuration(start: string, end: string | null): string {
  if (!end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch('/api/reddit/scan/history');
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load scan history');
        setScans(data.scans);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard/reddit-finder"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Scan History
            </h1>
          </div>
          <p className="text-slate-400 text-sm sm:text-base">
            View past scans and their results
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-5 bg-slate-700 rounded w-40" />
                  <div className="h-5 bg-slate-700 rounded w-20" />
                </div>
                <div className="mt-3 flex gap-6">
                  <div className="h-4 bg-slate-700/50 rounded w-24" />
                  <div className="h-4 bg-slate-700/50 rounded w-20" />
                  <div className="h-4 bg-slate-700/50 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-red-300">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && scans.length === 0 && (
          <div className="text-center py-16">
            <div className="text-slate-500 text-lg mb-2">No scans yet</div>
            <p className="text-slate-600 text-sm mb-4">
              Run your first scan to find Reddit opportunities.
            </p>
            <Link
              href="/dashboard/reddit-finder"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Go to Scanner
            </Link>
          </div>
        )}

        {/* Scan List */}
        {!loading && scans.length > 0 && (
          <div className="space-y-3">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">
                      {formatDate(scan.created_at)}
                    </span>
                    <StatusBadge status={scan.status} />
                  </div>
                  {scan.status === 'completed' && scan.result_count !== null && (
                    <Link
                      href={`/dashboard/reddit-finder?scan_id=${scan.id}`}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      View {scan.result_count} result{scan.result_count !== 1 ? 's' : ''} →
                    </Link>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-400">
                  <span>
                    Time range: <span className="text-slate-300">{scan.hours}h</span>
                  </span>
                  <span>
                    Duration: <span className="text-slate-300">{formatDuration(scan.created_at, scan.completed_at)}</span>
                  </span>
                  {scan.result_count !== null && (
                    <span>
                      Results: <span className="text-slate-300">{scan.result_count}</span>
                    </span>
                  )}
                </div>

                {scan.status === 'failed' && scan.error && (
                  <div className="mt-3 text-sm text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                    {scan.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
