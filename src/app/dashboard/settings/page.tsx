'use client';

import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import { SUBREDDITS, KEYWORDS } from '@/lib/reddit/config';

export default function SettingsPage() {
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [isCustom, setIsCustom] = useState({ subreddits: false, keywords: false });
  const [subredditInput, setSubredditInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSubreddits(data.subreddits);
      setKeywords(data.keywords);
      setIsCustom(data.isCustom);
    } catch {
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddits, keywords }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setIsCustom({ subreddits: true, keywords: true });
      setMessage({ type: 'success', text: 'Settings saved' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subreddits: null, keywords: null }),
      });
      if (!res.ok) throw new Error('Failed to reset');
      setSubreddits(SUBREDDITS);
      setKeywords(KEYWORDS);
      setIsCustom({ subreddits: false, keywords: false });
      setMessage({ type: 'success', text: 'Reset to defaults' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  const addTag = (
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    const trimmed = value.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList([...list, trimmed]);
    setInput('');
  };

  const removeTag = (tag: string, list: string[], setList: (v: string[]) => void) => {
    setList(list.filter((t) => t !== tag));
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    value: string,
    list: string[],
    setList: (v: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(value, list, setList, setInput);
    }
    if (e.key === 'Backspace' && !value && list.length > 0) {
      setList(list.slice(0, -1));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="h-40 bg-slate-800/50 rounded-lg" />
          <div className="h-40 bg-slate-800/50 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Settings
        </h1>
        <div className="flex gap-3">
          {(isCustom.subreddits || isCustom.keywords) && (
            <button
              onClick={resetToDefaults}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
              : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Subreddits */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Subreddits</h2>
          <span className="text-xs text-slate-500">({subreddits.length})</span>
          {!isCustom.subreddits && (
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">defaults</span>
          )}
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {subreddits.map((sub) => (
              <span
                key={sub}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full"
              >
                r/{sub}
                <button
                  onClick={() => removeTag(sub, subreddits, setSubreddits)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={subredditInput}
            onChange={(e) => setSubredditInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, subredditInput, subreddits, setSubreddits, setSubredditInput)}
            placeholder="Add subreddit (press Enter)"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>

      {/* Keywords */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Keywords</h2>
          <span className="text-xs text-slate-500">({keywords.length})</span>
          {!isCustom.keywords && (
            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">defaults</span>
          )}
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-300 text-sm rounded-full"
              >
                {kw}
                <button
                  onClick={() => removeTag(kw, keywords, setKeywords)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, keywordInput, keywords, setKeywords, setKeywordInput)}
            placeholder="Add keyword (press Enter)"
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </section>
    </div>
  );
}
