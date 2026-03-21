'use client';

import { useState, useEffect } from 'react';
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
  aiResponse?: string;
}

export default function RedditFinderPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [timeRange, setTimeRange] = useState('24 hours');
  const [selectedHours, setSelectedHours] = useState(24);
  const [generatingIdx, setGeneratingIdx] = useState<Set<number>>(new Set());
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Load saved opportunities from DB on mount
  useEffect(() => {
    async function loadSaved() {
      try {
        const res = await fetch('/api/reddit/opportunities/saved');
        const data = await res.json();
        if (res.ok && data.opportunities?.length > 0) {
          setOpportunities(data.opportunities);
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

    try {
      const response = await fetch(`/api/reddit/opportunities?hours=${selectedHours}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }

      setOpportunities(data.opportunities || []);
      setScannedCount(data.scannedSubreddits || 0);
      setTimeRange(data.timeRange || `${selectedHours} hours`);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
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
        prev.map((o, i) => (i === idx ? { ...o, aiResponse: data.response } : o))
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            FSA ContentTweakr
          </h1>
          <p className="text-slate-400">
            Find relevant Reddit posts where FreeSiteAudit can genuinely help
          </p>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Time Range
              </label>
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-600 text-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value={12}>Last 12 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={48}>Last 48 hours</option>
                <option value={72}>Last 3 days</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                &nbsp;
              </label>
              <Button
                onClick={findOpportunities}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Scanning...
                  </>
                ) : (
                  <span>Find Opportunities</span>
                )}
              </Button>
            </div>
          </div>

          {scannedCount > 0 && (
            <div className="mt-4 text-sm text-slate-400">
              Scanned {scannedCount} subreddits in the {timeRange}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading saved state */}
        {loadingSaved && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loadingSaved && opportunities.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-slate-500">
            Click &quot;Find Opportunities&quot; to scan Reddit
          </div>
        )}

        {/* Results */}
        {opportunities.length > 0 && (
          <>
            <div className="mb-4 text-sm font-medium text-slate-400">
              Found {opportunities.length} opportunities
            </div>

            <div className="space-y-4">
              {opportunities.map((opp, idx) => (
                <div
                  key={opp.url}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:border-slate-600/50 transition-all duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/30">
                          r/{opp.subreddit}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-300 border border-emerald-700/30">
                          {opp.confidence}% match
                        </span>
                        <span className="text-xs text-slate-500">
                          {opp.upvotes} upvotes &middot; {opp.comments} comments
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-1">
                        {opp.title}
                      </h3>
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View on Reddit &rarr;
                      </a>
                    </div>
                  </div>

                  {/* Context */}
                  {opp.context && (
                    <div className="bg-slate-900/50 rounded-lg p-4 mb-4 border border-slate-700/30">
                      <p className="text-sm text-slate-300 line-clamp-3">
                        {opp.context}
                      </p>
                    </div>
                  )}

                  {/* AI Response Section */}
                  <div className="border-t border-slate-700/50 pt-4">
                    {opp.aiResponse ? (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-300">
                            AI-Generated Response
                          </span>
                          <Button
                            onClick={() => copyToClipboard(opp.aiResponse!, idx)}
                            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors px-3 py-1 rounded-md"
                          >
                            {copiedIdx === idx ? 'Copied!' : 'Copy'}
                          </Button>
                        </div>
                        <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-4 animate-in fade-in duration-300">
                          <p className="text-sm text-emerald-200 leading-relaxed whitespace-pre-wrap">
                            {opp.aiResponse}
                          </p>
                        </div>
                      </>
                    ) : (
                      <Button
                        onClick={() => generateResponse(idx)}
                        disabled={generatingIdx.has(idx)}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {generatingIdx.has(idx) ? (
                          <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
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
