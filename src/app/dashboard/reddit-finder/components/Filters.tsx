'use client';

export interface FiltersProps {
  visibleCount: number;
  hiddenCount: number;
  showHidden: boolean;
  onSetShowHidden: (show: boolean) => void;
}

export default function Filters({
  visibleCount,
  hiddenCount,
  showHidden,
  onSetShowHidden,
}: FiltersProps) {
  if (visibleCount === 0) return null;

  return (
    <div className="mb-4 flex items-center justify-between">
      <span className="text-sm font-medium text-slate-400">
        {visibleCount} opportunit
        {visibleCount === 1 ? 'y' : 'ies'}
        {showHidden && hiddenCount > 0 && ` (${hiddenCount} hidden)`}
      </span>
      {hiddenCount > 0 && (
        <button
          onClick={() => onSetShowHidden(!showHidden)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showHidden ? 'Hide hidden' : `Show ${hiddenCount} hidden`}
        </button>
      )}
    </div>
  );
}
