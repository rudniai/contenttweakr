'use client';

import { Button } from '@/components/ui/button';
import type { ScanStatus } from './types';

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

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500" />
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

export interface ScanControlsProps {
  selectedHours: number;
  onSelectedHoursChange: (hours: number) => void;
  loading: boolean;
  scanStatus: ScanStatus | null;
  onFindOpportunities: () => void;
}

export default function ScanControls({
  selectedHours,
  onSelectedHoursChange,
  loading,
  scanStatus,
  onFindOpportunities,
}: ScanControlsProps) {
  const isScanning = loading && scanStatus !== null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Time Range
          </label>
          <select
            value={selectedHours}
            onChange={(e) => onSelectedHoursChange(parseInt(e.target.value))}
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
          onClick={onFindOpportunities}
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
  );
}
