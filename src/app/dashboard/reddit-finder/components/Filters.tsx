'use client';

import type { Platform } from './types';

export type PlatformFilter = 'all' | Platform;

export interface FiltersProps {
  visibleCount: number;
  hiddenCount: number;
  repliedCount: number;
  showHidden: boolean;
  hideReplied: boolean;
  onSetShowHidden: (show: boolean) => void;
  onSetHideReplied: (hide: boolean) => void;
  platformFilter: PlatformFilter;
  onSetPlatformFilter: (filter: PlatformFilter) => void;
  hasHN: boolean;
  hasPH: boolean;
}

export default function Filters({
  visibleCount,
  hiddenCount,
  repliedCount,
  showHidden,
  hideReplied,
  onSetShowHidden,
  onSetHideReplied,
  platformFilter,
  onSetPlatformFilter,
  hasHN,
  hasPH,
}: FiltersProps) {
  if (visibleCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-400">
          {visibleCount} opportunit
          {visibleCount === 1 ? 'y' : 'ies'}
          {showHidden && hiddenCount > 0 && ` (${hiddenCount} hidden)`}
        </span>
        {(hasHN || hasPH) && (
          <div className="flex items-center bg-slate-800/50 rounded-lg border border-slate-700/50 p-0.5">
            {(['all', 'reddit', ...(hasHN ? ['hackernews'] : []), ...(hasPH ? ['producthunt'] : [])] as const).map((val) => (
              <button
                key={val}
                onClick={() => onSetPlatformFilter(val as PlatformFilter)}
                className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                  platformFilter === val
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {val === 'all' ? 'All' : val === 'reddit' ? 'Reddit' : val === 'hackernews' ? 'HN' : 'PH'}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-4">
        {repliedCount > 0 && (
          <button
            onClick={() => onSetHideReplied(!hideReplied)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {hideReplied ? `Show ${repliedCount} replied` : 'Hide replied'}
          </button>
        )}
        {hiddenCount > 0 && (
          <button
            onClick={() => onSetShowHidden(!showHidden)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showHidden ? 'Hide hidden' : `Show ${hiddenCount} hidden`}
          </button>
        )}
      </div>
    </div>
  );
}
