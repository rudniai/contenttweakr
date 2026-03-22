'use client';

export interface FiltersProps {
  visibleCount: number;
  hiddenCount: number;
  repliedCount: number;
  showHidden: boolean;
  hideReplied: boolean;
  onSetShowHidden: (show: boolean) => void;
  onSetHideReplied: (hide: boolean) => void;
}

export default function Filters({
  visibleCount,
  hiddenCount,
  repliedCount,
  showHidden,
  hideReplied,
  onSetShowHidden,
  onSetHideReplied,
}: FiltersProps) {
  if (visibleCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-sm font-medium text-slate-400">
        {visibleCount} opportunit
        {visibleCount === 1 ? 'y' : 'ies'}
        {showHidden && hiddenCount > 0 && ` (${hiddenCount} hidden)`}
      </span>
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
