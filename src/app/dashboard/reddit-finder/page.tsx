'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface Opportunity {
  id?: string;
  date: string;
  subreddit: string;
  title: string;
  url: string;
  context: string;
  confidence: number;
  upvotes: number;
  comments: number;
  hidden?: boolean;
  aiResponse?: string;
}

interface ScanStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  hours: number;
  result_count: number | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
  opportunities?: Opportunity[];
}

function SkeletonCard() {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 animate-pulse">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-20 bg-slate-700 rounded-full" />
        <div className="h-5 w-16 bg-slate-700 rounded-full" />
      </div>
      <div className="h-6 w-3/4 bg-slate-700 rounded mb-2" />
      <div className="h-4 w-32 bg-slate-700/60 rounded mb-4" />
      <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/30">
        <div className="h-3 w-full bg-slate-700/50 rounded mb-2" />
        <div className="h-3 w-5/6 bg-slate-700/50 rounded mb-2" />
        <div className="h-3 w-2/3 bg-slate-700/50 rounded" />
      </div>
      <div className="h-10 w-full bg-slate-700/40 rounded-lg" />
    </div>
  );
}

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/30'
      : score >= 40
        ? 'bg-amber-900/50 text-amber-300 border-amber-700/30'
        : 'bg-slate-700/50 text-slate-300 border-slate-600/30';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}
    >
      {score}% match
    </span>
  );
}

function ScanProgressIndicator({ status, resultCount }: { status: string; resultCount: number | null }) {
  const stages = [
    { key: 'pending', label: 'Queued', icon: '⏳' },
    { key: 'processing', label: 'Scanning Reddit', icon: '🔍' },
    { key: 'completed', label: resultCount !== null ? `Found ${resultCount} results` : 'Complete', icon: '✅' },
  ];

  const currentIdx = stages.findIndex(s => s.key === status);

  return (
    <div className="flex items-center gap-3">
      {stages.map((stage, idx) => {
        const isActive = stage.key === status;
        const isDone = idx < currentIdx;
        const isFuture = idx > currentIdx;

        return (
          <div key={stage.key} className="flex items-center gap-2">
            {idx > 0 && (
              <div className={`w-8 h-0.5 ${isDone ? 'bg-emerald-500' : isFuture ? 'bg-slate-700' : 'bg-blue-500'}`} />
            )}
            <div className={`flex items-center gap-1.5 text-sm ${
              isActive ? 'text-blue-300 font-medium' : isDone ? 'text-emerald-400' : 'text-slate-600'
            }`}>
              <span className="text-base">{isDone ? '✅' : stage.icon}</span>
              <span>{stage.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
    </span>
  );
}

function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-white ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function RedditFinderPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedHours, setSelectedHours] = useState(24);
  const [generatingIdx, setGeneratingIdx] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [hidingIds, setHidingIds] = useState<Set<string>>(new Set());

  // Scan request state
  const [scanRequestId, setScanRequestId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Poll scan status
  useEffect(() => {
    if (!scanRequestId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/reddit/scan/status/${scanRequestId}`);
        const data: ScanStatus = await res.json();
        setScanStatus(data);

        if (data.status === 'completed') {
          stopPolling();
          setLoading(false);
          setHasScanned(true);

          if (data.opportunities && data.opportunities.length > 0) {
            setOpportunities(data.opportunities.map(opp => ({
              id: opp.id,
              date: opp.date || '',
              subreddit: opp.subreddit,
              title: opp.title,
              url: opp.url,
              context: opp.context || '',
              confidence: opp.confidence,
              upvotes: opp.upvotes,
              comments: opp.comments,
            })));
          } else {
            setOpportunities([]);
          }
          setScanRequestId(null);
        } else if (data.status === 'failed') {
          stopPolling();
          setLoading(false);
          setError(data.error || 'Scan failed');
          setScanRequestId(null);
        }
      } catch (err) {
        console.error('Failed to poll scan status:', err);
      }
    };

    // Poll immediately, then every 3 seconds
    poll();
    pollIntervalRef.current = setInterval(poll, 3000);

    return () => stopPolling();
  }, [scanRequestId, stopPolling]);

  // Load saved opportunities from DB on mount
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch('/api/reddit/opportunities/saved');
        const data = await res.json();
        if (res.ok && data.opportunities?.length > 0) {
          setOpportunities(data.opportunities);
          setHasScanned(true);
        }
      } catch (err) {
        console.error('Failed to load saved opportunities:', err);
      } finally {
        setLoadingSaved(false);
      }
    }
    loadSaved();
  }, []);

  const findOpportunities = async () => {
    setLoading(true);
    setError(null);
    setScanStatus(null);

    try {
      const response = await fetch('/api/reddit/scan/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: selectedHours }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create scan request');
      }

      setScanRequestId(data.id);
      setScanStatus({ id: data.id, status: 'pending', hours: selectedHours, result_count: null, error: null, created_at: new Date().toISOString(), completed_at: null });
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setLoading(false);
    }
  };

  const generateResponse = async (idx: number) => {
    const opp = opportunities[idx];
    setGeneratingIdx((prev) => new Set(prev).add(idx));

    try {
      const res = await fetch('/api/reddit/generate-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: opp.title,
          context: opp.context,
          subreddit: opp.subreddit,
          opportunityUrl: opp.url,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate response');
      }

      setOpportunities((prev) =>
        prev.map((o, i) =>
          i === idx ? { ...o, aiResponse: data.response } : o
        )
      );
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setGeneratingIdx((prev) => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    }
  };

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const hideOpportunity = async (opp: Opportunity) => {
    if (!opp.id) return;
    const newHidden = !opp.hidden;

    // Optimistic update
    setHidingIds((prev) => new Set(prev).add(opp.id!));
    setOpportunities((prev) =>
      prev.map((o) => (o.id === opp.id ? { ...o, hidden: newHidden } : o))
    );

    try {
      const res = await fetch('/api/reddit/opportunities/hide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunityId: opp.id, hidden: newHidden }),
      });

      if (!res.ok) {
        // Revert on failure
        setOpportunities((prev) =>
          prev.map((o) => (o.id === opp.id ? { ...o, hidden: !newHidden } : o))
        );
      }
    } catch {
      // Revert on failure
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opp.id ? { ...o, hidden: !newHidden } : o))
      );
    } finally {
      setHidingIds((prev) => {
        const next = new Set(prev);
        next.delete(opp.id!);
        return next;
      });
    }
  };

  const visibleOpportunities = showHidden
    ? opportunities
    : opportunities.filter((o) => !o.hidden);

  const hiddenCount = opportunities.filter((o) => o.hidden).length;

  const isScanning = loading && scanStatus !== null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            FSA ContentTweakr
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Find relevant Reddit posts where FreeSiteAudit can genuinely help
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time Range
              </label>
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value={12}>Last 12 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={48}>Last 48 hours</option>
                <option value={72}>Last 3 days</option>
              </select>
            </div>

            <Button
              onClick={findOpportunities}
              disabled={loading}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-8 rounded-lg disabled:opacity-50 transition-colors h-[42px]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner />
                  Scanning...
                </span>
              ) : (
                'Find Opportunities'
              )}
            </Button>
          </div>

          {/* Scan progress */}
          {isScanning && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 text-sm text-blue-300">
                <PulsingDot />
                <span>
                  {scanStatus?.status === 'pending' && 'Starting scan...'}
                  {scanStatus?.status === 'processing' && 'Scanning Reddit...'}
                </span>
              </div>

              <ScanProgressIndicator
                status={scanStatus?.status || 'pending'}
                resultCount={scanStatus?.result_count ?? null}
              />

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30">
                <p className="text-xs text-slate-500">
                  Scan triggered immediately. Results will appear shortly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6 flex items-center gap-3">
            <span className="text-lg">&#x26A0;</span>
            <div>
              <p className="font-medium">Scan Error</p>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading saved state */}
        {loadingSaved && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Scanning skeleton */}
        {loading && (
          <div className="space-y-4">
            <div className="mb-4 text-sm font-medium text-slate-500">
              Finding opportunities...
            </div>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Empty state - never scanned */}
        {!loadingSaved &&
          !loading &&
          !hasScanned &&
          visibleOpportunities.length === 0 &&
          !error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-slate-400 text-lg mb-1">
                Ready to find opportunities
              </p>
              <p className="text-slate-500 text-sm">
                Click &quot;Find Opportunities&quot; to scan Reddit for relevant
                posts
              </p>
            </div>
          )}

        {/* Empty state - scanned but found nothing */}
        {!loadingSaved &&
          !loading &&
          hasScanned &&
          visibleOpportunities.length === 0 &&
          !error && (
            <div className="text-center py-16">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-slate-400 text-lg mb-1">
                {hiddenCount > 0
                  ? `All opportunities are hidden`
                  : `No opportunities found in the last ${selectedHours} hours`}
              </p>
              <p className="text-slate-500 text-sm">
                {hiddenCount > 0 ? (
                  <button
                    onClick={() => setShowHidden(true)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Show {hiddenCount} hidden opportunit{hiddenCount === 1 ? 'y' : 'ies'}
                  </button>
                ) : (
                  'Try a different time range or check back later'
                )}
              </p>
            </div>
          )}

        {/* Results */}
        {!loading && visibleOpportunities.length > 0 && (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-400">
                {visibleOpportunities.length} opportunit
                {visibleOpportunities.length === 1 ? 'y' : 'ies'}
                {showHidden && hiddenCount > 0 && ` (${hiddenCount} hidden)`}
              </span>
              {hiddenCount > 0 && (
                <button
                  onClick={() => setShowHidden(!showHidden)}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showHidden ? 'Hide hidden' : `Show ${hiddenCount} hidden`}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {visibleOpportunities.map((opp, idx) => (
                <div
                  key={opp.url + idx}
                  className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 hover:border-slate-600/50 transition-all duration-200 relative ${opp.hidden ? 'opacity-50' : ''}`}
                >
                  {/* Hide button */}
                  {opp.id && (
                    <button
                      onClick={() => hideOpportunity(opp)}
                      disabled={hidingIds.has(opp.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors"
                      title={opp.hidden ? 'Unhide opportunity' : 'Hide opportunity'}
                    >
                      {opp.hidden ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  )}

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/30">
                      r/{opp.subreddit}
                    </span>
                    <ConfidenceBadge score={opp.confidence} />
                    <span className="text-xs text-slate-500">
                      {opp.upvotes} upvotes &middot; {opp.comments} comments
                    </span>
                  </div>

                  {/* Title */}
                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group mb-1"
                  >
                    <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug">
                      {opp.title}
                    </h3>
                  </a>
                  <a
                    href={opp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs text-blue-400/70 hover:text-blue-300 transition-colors mb-3"
                  >
                    View on Reddit &rarr;
                  </a>

                  {/* Context */}
                  {opp.context && (
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/30">
                      <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                        {opp.context}
                      </p>
                    </div>
                  )}

                  {/* AI Response / Generate Button */}
                  <div className="border-t border-slate-700/50 pt-4">
                    {opp.aiResponse ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-emerald-400">
                            Generated Response
                          </span>
                          <Button
                            onClick={() =>
                              copyToClipboard(opp.aiResponse!, idx)
                            }
                            className={`text-xs px-3 py-1 rounded-md transition-colors ${
                              copiedIdx === idx
                                ? 'bg-emerald-700 text-emerald-100'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            }`}
                          >
                            {copiedIdx === idx ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-4">
                          <p className="text-sm text-emerald-200 leading-relaxed whitespace-pre-wrap">
                            {opp.aiResponse}
                          </p>
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={() => generateResponse(idx)}
                        disabled={generatingIdx.has(idx)}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {generatingIdx.has(idx) ? (
                          <span className="flex items-center justify-center gap-2">
                            <Spinner className="h-4 w-4" />
                            Generating Response...
                          </span>
                        ) : (
                          'Generate Response'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
