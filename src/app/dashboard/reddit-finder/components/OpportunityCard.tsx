'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Opportunity, AIModel } from './types';

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
  onGenerateResponse: (idx: number, model?: AIModel) => void;
  onCopyToClipboard: (text: string, idx: number) => void;
  onHide: (opp: Opportunity) => void;
  onMarkReplied: (opp: Opportunity) => void;
  isMarkingReplied: boolean;
  isSelected?: boolean;
  onSelect?: (opp: Opportunity) => void;
  onDeleteResponse?: (opp: Opportunity) => void;
  isDeletingResponse?: boolean;
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
  onMarkReplied,
  isMarkingReplied,
  isSelected = false,
  onSelect,
  onDeleteResponse,
  isDeletingResponse = false,
}: OpportunityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [selectedModel, setSelectedModel] = useState<AIModel>('sonnet');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contextExpanded, setContextExpanded] = useState(false);

  const handleEdit = () => {
    setEditedText(opp.aiResponse || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedText('');
    setIsEditing(false);
  };

  // Use edited text if available, otherwise original
  const displayText = editedText || opp.aiResponse || '';
  const isEdited = editedText !== '' && editedText !== opp.aiResponse;

  return (
    <div
      className={`bg-slate-800/50 backdrop-blur-sm rounded-xl border ${isSelected ? 'border-blue-500/70 ring-1 ring-blue-500/30' : 'border-slate-700/50'} p-4 sm:p-6 hover:border-slate-600/50 transition-all duration-200 relative overflow-hidden min-w-0 ${opp.hidden ? 'opacity-50' : ''} ${opp.repliedAt ? 'opacity-60' : ''}`}
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
        {onSelect && opp.id && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(opp)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0 cursor-pointer shrink-0"
            aria-label={`Select ${opp.title}`}
          />
        )}
        {opp.platform === 'producthunt' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-900/50 text-pink-300 border border-pink-700/30">
            <svg className="h-3 w-3" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm1.2 24h-5.2v6h-4V10h9.2c4.418 0 8 3.582 8 7s-3.582 7-8 7zm-.2-10.4H16v6.8h5c1.878 0 3.4-1.522 3.4-3.4S22.878 13.6 21 13.6z"/></svg>
            Product Hunt
          </span>
        ) : opp.platform === 'hackernews' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-900/50 text-orange-300 border border-orange-700/30">
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor"><path d="M0 0v16h16V0H0zm8.7 8.6v4.3H7.3V8.6L4 3h1.6L8 7l2.4-4H12L8.7 8.6z"/></svg>
            Hacker News
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/30">
            r/{opp.subreddit}
          </span>
        )}
        <ConfidenceBadge score={opp.confidence} />
        {opp.repliedAt && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-700/30">
            Replied
          </span>
        )}
        <span className="text-xs text-slate-500">
          {opp.platform === 'hackernews' ? 'points' : opp.platform === 'producthunt' ? 'votes' : 'upvotes'}: {opp.upvotes} &middot; {opp.comments} comments
        </span>
      </div>

      {/* Title */}
      <a
        href={opp.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block group mb-1"
      >
        <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-blue-400 transition-colors leading-snug break-words" style={{ overflowWrap: 'anywhere' }}>
          {opp.title}
        </h3>
      </a>
      <a
        href={opp.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1 text-xs transition-colors mb-3 break-all ${opp.platform === 'producthunt' ? 'text-pink-400/70 hover:text-pink-300' : opp.platform === 'hackernews' ? 'text-orange-400/70 hover:text-orange-300' : 'text-blue-400/70 hover:text-blue-300'}`}
      >
        {opp.platform === 'producthunt' ? (
          <>
            <svg className="h-3 w-3" viewBox="0 0 40 40" fill="currentColor"><path d="M20 0C8.954 0 0 8.954 0 20s8.954 20 20 20 20-8.954 20-20S31.046 0 20 0zm1.2 24h-5.2v6h-4V10h9.2c4.418 0 8 3.582 8 7s-3.582 7-8 7zm-.2-10.4H16v6.8h5c1.878 0 3.4-1.522 3.4-3.4S22.878 13.6 21 13.6z"/></svg>
            View on Product Hunt &rarr;
          </>
        ) : opp.platform === 'hackernews' ? (
          <>
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor"><path d="M0 0v16h16V0H0zm8.7 8.6v4.3H7.3V8.6L4 3h1.6L8 7l2.4-4H12L8.7 8.6z"/></svg>
            View on Hacker News &rarr;
          </>
        ) : (
          <>View on Reddit &rarr;</>
        )}
      </a>

      {/* Context */}
      {opp.context && (
        <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 mb-4 border border-slate-700/30">
          <p className={`text-sm text-slate-400 leading-relaxed break-words ${contextExpanded ? '' : 'line-clamp-3 sm:line-clamp-3'}`} style={{ overflowWrap: 'anywhere' }}>
            {opp.context}
          </p>
          {opp.context.length > 150 && (
            <button
              onClick={() => setContextExpanded(!contextExpanded)}
              className="mt-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {contextExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      {/* AI Response / Generate Button */}
      <div className="border-t border-slate-700/50 pt-4">
        {opp.aiResponse ? (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-emerald-400">
                  Generated Response
                </span>
                {opp.aiResponseModel && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    opp.aiResponseModel === 'opus'
                      ? 'bg-violet-900/50 text-violet-300 border border-violet-700/30'
                      : 'bg-sky-900/50 text-sky-300 border border-sky-700/30'
                  }`}>
                    {opp.aiResponseModel === 'opus' ? 'Opus' : 'Sonnet'}
                  </span>
                )}
                {isEdited && !isEditing && (
                  <span className="text-xs text-amber-400/70">(edited)</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      className="text-xs px-3 py-1.5 sm:py-1 rounded-md bg-emerald-700 hover:bg-emerald-600 text-emerald-100 transition-colors"
                    >
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
                      className="text-xs px-3 py-1.5 sm:py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      onClick={handleEdit}
                      aria-label="Edit response"
                      className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                    <Button
                      onClick={() => onCopyToClipboard(displayText, idx)}
                      aria-label="Copy response to clipboard"
                      className={`text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md transition-colors ${
                        copiedIdx === idx
                          ? 'bg-emerald-700 text-emerald-100'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                        <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                      </svg>
                      <span className="hidden sm:inline">{copiedIdx === idx ? 'Copied!' : 'Copy'}</span>
                      <span className="sm:hidden">{copiedIdx === idx ? '✓' : ''}</span>
                    </Button>
                    {onDeleteResponse && opp.aiResponseId && (
                      showDeleteConfirm ? (
                        <>
                          <Button
                            onClick={() => {
                              onDeleteResponse(opp);
                              setShowDeleteConfirm(false);
                            }}
                            disabled={isDeletingResponse}
                            className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md bg-red-700 hover:bg-red-600 text-red-100 transition-colors"
                          >
                            {isDeletingResponse ? '...' : 'Confirm'}
                          </Button>
                          <Button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={() => setShowDeleteConfirm(true)}
                          aria-label="Delete response"
                          className="text-xs px-2 py-1.5 sm:py-1 rounded-md bg-slate-700 hover:bg-red-700/70 text-slate-400 hover:text-red-200 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </Button>
                      )
                    )}
                    {onDeleteResponse && opp.aiResponseId && !showDeleteConfirm && (
                      <Button
                        onClick={() => {
                          onDeleteResponse(opp);
                        }}
                        disabled={isDeletingResponse || isGenerating}
                        aria-label="Regenerate response"
                        className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md bg-blue-700 hover:bg-blue-600 text-blue-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">Regenerate</span>
                      </Button>
                    )}
                    {!opp.repliedAt && opp.id && (
                      <Button
                        onClick={() => onMarkReplied(opp)}
                        disabled={isMarkingReplied}
                        className="text-xs px-2 sm:px-3 py-1.5 sm:py-1 rounded-md bg-purple-700 hover:bg-purple-600 text-purple-100 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 sm:hidden" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="hidden sm:inline">{isMarkingReplied ? 'Marking...' : 'Mark as Replied'}</span>
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full bg-emerald-950/30 border border-emerald-600/50 rounded-lg p-4 text-sm text-emerald-200 leading-relaxed resize-y min-h-[120px] focus:outline-none focus:border-emerald-500/70 transition-colors"
                rows={6}
              />
            ) : (
              <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-lg p-3 sm:p-4">
                <p className="text-sm text-emerald-200 leading-relaxed whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>
                  {displayText}
                </p>
              </div>
            )}
            {isEdited && !isEditing && (
              <button
                onClick={() => {
                  setEditedText('');
                }}
                className="mt-2 text-xs text-slate-500 hover:text-slate-400 transition-colors"
              >
                Restore original
              </button>
            )}
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
          <div className="flex gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as AIModel)}
              className="bg-slate-700 border border-slate-600 text-slate-200 text-sm rounded-lg px-2 sm:px-3 py-2.5 focus:outline-none focus:border-blue-500 transition-colors shrink-0"
            >
              <option value="sonnet">Sonnet</option>
              <option value="opus">Opus</option>
            </select>
            <Button
              onClick={() => onGenerateResponse(idx, selectedModel)}
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 px-3 sm:px-4 rounded-lg transition-colors min-w-0"
            >
              Generate Response
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
