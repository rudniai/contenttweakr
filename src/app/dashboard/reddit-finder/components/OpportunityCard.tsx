'use client';

import { Button } from '@/components/ui/button';
import type { Opportunity } from './types';

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

export interface OpportunityCardProps {
  opportunity: Opportunity;
  index: number;
  isGenerating: boolean;
  isHiding: boolean;
  copiedIdx: number | null;
  onGenerateResponse: (idx: number) => void;
  onCopyToClipboard: (text: string, idx: number) => void;
  onHide: (opp: Opportunity) => void;
}

export default function OpportunityCard({
  opportunity: opp,
  index: idx,
  isGenerating,
  isHiding,
  copiedIdx,
  onGenerateResponse,
  onCopyToClipboard,
  onHide,
}: OpportunityCardProps) {
  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 hover:border-slate-600/50 transition-all duration-200 relative ${opp.hidden ? 'opacity-50' : ''}`}
    >
      {/* Hide button */}
      {opp.id && (
        <button
          onClick={() => onHide(opp)}
          disabled={isHiding}
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
                onClick={() => onCopyToClipboard(opp.aiResponse!, idx)}
                aria-label="Copy response to clipboard"
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
        ) : isGenerating ? (
          <div className="space-y-3 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <Spinner className="h-4 w-4" />
              <span className="text-sm text-blue-300 font-medium">Generating response...</span>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
              <div className="h-3 w-full bg-slate-700/50 rounded mb-2" />
              <div className="h-3 w-5/6 bg-slate-700/50 rounded mb-2" />
              <div className="h-3 w-4/6 bg-slate-700/50 rounded mb-2" />
              <div className="h-3 w-3/4 bg-slate-700/50 rounded" />
            </div>
          </div>
        ) : (
          <Button
            onClick={() => onGenerateResponse(idx)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            Generate Response
          </Button>
        )}
      </div>
    </div>
  );
}
