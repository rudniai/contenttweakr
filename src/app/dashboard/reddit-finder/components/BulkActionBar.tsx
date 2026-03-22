'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkHide: () => void;
  onBulkMarkReplied: () => void;
  onBulkDelete: () => void;
  isBulkActioning: boolean;
}

export default function BulkActionBar({
  selectedCount,
  totalCount,
  allSelected,
  onSelectAll,
  onDeselectAll,
  onBulkHide,
  onBulkMarkReplied,
  onBulkDelete,
  isBulkActioning,
}: BulkActionBarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0 && totalCount === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 bg-slate-800/70 border border-slate-700/50 rounded-xl px-4 py-3">
      {/* Select All checkbox */}
      <label className="flex items-center gap-2 cursor-pointer shrink-0">
        <input
          type="checkbox"
          checked={allSelected && totalCount > 0}
          onChange={allSelected ? onDeselectAll : onSelectAll}
          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer"
          aria-label="Select all opportunities"
        />
        <span className="text-sm text-slate-400">
          Select all
        </span>
      </label>

      {selectedCount > 0 && (
        <>
          <span className="text-sm text-slate-500">|</span>
          <span className="text-sm font-medium text-blue-300">
            {selectedCount} selected
          </span>
          <span className="text-sm text-slate-500">|</span>

          <div className="flex items-center gap-2">
            <Button
              onClick={onBulkHide}
              disabled={isBulkActioning}
              className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Hide ({selectedCount})
            </Button>
            <Button
              onClick={onBulkMarkReplied}
              disabled={isBulkActioning}
              className="text-xs px-3 py-1.5 rounded-md bg-purple-700 hover:bg-purple-600 text-purple-100 transition-colors"
            >
              Mark as replied ({selectedCount})
            </Button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-400">Delete {selectedCount}?</span>
                <Button
                  onClick={() => {
                    onBulkDelete();
                    setShowDeleteConfirm(false);
                  }}
                  disabled={isBulkActioning}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-red-100 transition-colors"
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-xs px-3 py-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isBulkActioning}
                className="text-xs px-3 py-1.5 rounded-md bg-red-900/50 hover:bg-red-800/50 text-red-300 transition-colors"
              >
                Delete ({selectedCount})
              </Button>
            )}
          </div>

          <button
            onClick={onDeselectAll}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear selection
          </button>
        </>
      )}
    </div>
  );
}
