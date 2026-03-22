'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Opportunity, ScanStatus } from './components/types';
import ScanControls from './components/ScanControls';
import Filters from './components/Filters';
import OpportunityList from './components/OpportunityList';

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

  const copyToClipboard = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    } catch {
      setError('Failed to copy to clipboard');
    }
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

        <ScanControls
          selectedHours={selectedHours}
          onSelectedHoursChange={setSelectedHours}
          loading={loading}
          scanStatus={scanStatus}
          onFindOpportunities={findOpportunities}
        />

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

        {!loading && visibleOpportunities.length > 0 && (
          <Filters
            visibleCount={visibleOpportunities.length}
            hiddenCount={hiddenCount}
            showHidden={showHidden}
            onSetShowHidden={setShowHidden}
          />
        )}

        <OpportunityList
          opportunities={visibleOpportunities}
          loading={loading}
          loadingSaved={loadingSaved}
          hasScanned={hasScanned}
          selectedHours={selectedHours}
          hiddenCount={hiddenCount}
          showHidden={showHidden}
          generatingIdx={generatingIdx}
          hidingIds={hidingIds}
          copiedIdx={copiedIdx}
          error={error}
          onGenerateResponse={generateResponse}
          onCopyToClipboard={copyToClipboard}
          onHide={hideOpportunity}
          onSetShowHidden={setShowHidden}
        />
      </div>
    </div>
  );
}
