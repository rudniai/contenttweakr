'use client';

import type { Opportunity } from './types';
import OpportunityCard from './OpportunityCard';

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

export interface OpportunityListProps {
  opportunities: Opportunity[];
  loading: boolean;
  loadingSaved: boolean;
  hasScanned: boolean;
  selectedHours: number;
  hiddenCount: number;
  showHidden: boolean;
  generatingIdx: Set<number>;
  hidingIds: Set<string>;
  copiedIdx: number | null;
  error: string | null;
  onGenerateResponse: (idx: number) => void;
  onCopyToClipboard: (text: string, idx: number) => void;
  onHide: (opp: Opportunity) => void;
  onMarkReplied: (opp: Opportunity) => void;
  markingRepliedIds: Set<string>;
  onSetShowHidden: (show: boolean) => void;
  selectedIds?: Set<string>;
  onSelect?: (opp: Opportunity) => void;
}

export default function OpportunityList({
  opportunities: visibleOpportunities,
  loading,
  loadingSaved,
  hasScanned,
  selectedHours,
  hiddenCount,
  showHidden,
  generatingIdx,
  hidingIds,
  copiedIdx,
  error,
  onGenerateResponse,
  onCopyToClipboard,
  onHide,
  onMarkReplied,
  markingRepliedIds,
  onSetShowHidden,
  selectedIds,
  onSelect,
}: OpportunityListProps) {
  // Loading saved state
  if (loadingSaved) {
    return (
      <div className="space-y-4">
        <div className="mb-4 text-sm font-medium text-slate-500">
          Loading saved opportunities...
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Scanning skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="mb-4 text-sm font-medium text-slate-500">
          Finding opportunities...
        </div>
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  // Empty state - never scanned
  if (!hasScanned && visibleOpportunities.length === 0 && !error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-slate-400 text-lg mb-1">
          Ready to find opportunities
        </p>
        <p className="text-slate-500 text-sm">
          Click &quot;Find Opportunities&quot; to scan Reddit for relevant posts
        </p>
      </div>
    );
  }

  // Empty state - scanned but found nothing
  if (hasScanned && visibleOpportunities.length === 0 && !error) {
    return (
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
              onClick={() => onSetShowHidden(true)}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Show {hiddenCount} hidden opportunit{hiddenCount === 1 ? 'y' : 'ies'}
            </button>
          ) : (
            'Try a different time range or check back later'
          )}
        </p>
      </div>
    );
  }

  // Results
  if (visibleOpportunities.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        {visibleOpportunities.map((opp, idx) => (
          <OpportunityCard
            key={opp.url + idx}
            opportunity={opp}
            index={idx}
            isGenerating={generatingIdx.has(idx)}
            isHiding={!!opp.id && hidingIds.has(opp.id)}
            copiedIdx={copiedIdx}
            onGenerateResponse={onGenerateResponse}
            onCopyToClipboard={onCopyToClipboard}
            onHide={onHide}
            onMarkReplied={onMarkReplied}
            isMarkingReplied={!!opp.id && markingRepliedIds.has(opp.id)}
            isSelected={!!opp.id && !!selectedIds?.has(opp.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </>
  );
}
