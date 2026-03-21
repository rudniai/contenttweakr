'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Opportunity {
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
  const [error, setError] = useState<string | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [timeRange, setTimeRange] = useState('24 hours');
  const [selectedHours, setSelectedHours] = useState(24);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Reddit Opportunity Finder
          </h1>
          <p className="text-slate-600">
            Find relevant Reddit posts where FreeSiteAudit can genuinely help
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Time Range
              </label>
              <select
                value={selectedHours}
                onChange={(e) => setSelectedHours(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value={12}>Last 12 hours</option>
                <option value={24}>Last 24 hours</option>
                <option value={48}>Last 48 hours</option>
                <option value={72}>Last 3 days</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                &nbsp;
              </label>
              <Button
                onClick={findOpportunities}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
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
                  <span>🔍 Find Opportunities</span>
                )}
              </Button>
            </div>
          </div>

          {scannedCount > 0 && (
            <div className="mt-4 text-sm text-slate-600">
              Scanned {scannedCount} subreddits in the {timeRange}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {opportunities.length === 0 && !loading && !error && (
          <div className="text-center py-12 text-slate-500">
            Click "Find Opportunities" to scan Reddit
          </div>
        )}

        {opportunities.length > 0 && (
          <>
            <div className="mb-4 text-sm font-medium text-slate-700">
              Found {opportunities.length} opportunities
            </div>

            <div className="space-y-4">
              {opportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          r/{opp.subreddit}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {opp.confidence}% match
                        </span>
                        <span className="text-xs text-slate-500">
                          {opp.upvotes} ⬆️ · {opp.comments} 💬
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-1">
                        {opp.title}
                      </h3>
                      <a
                        href={opp.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View on Reddit →
                      </a>
                    </div>
                  </div>

                  {/* Context */}
                  {opp.context && (
                    <div className="bg-slate-50 rounded-lg p-4 mb-4">
                      <p className="text-sm text-slate-700 line-clamp-3">
                        {opp.context}
                      </p>
                    </div>
                  )}

                  {/* AI Response Placeholder */}
                  <div className="border-t border-slate-200 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">
                        AI-Generated Response
                      </span>
                      <Button
                        onClick={() => copyToClipboard(opp.aiResponse || '(Generate with Opus)')}
                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        📋 Copy
                      </Button>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-900">
                        ⚡ Click &ldquo;Generate Opus Responses&rdquo; to create AI-powered replies
                      </p>
                    </div>
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
