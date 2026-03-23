'use client';

import { useEffect, useState, useCallback, KeyboardEvent } from 'react';
import { SUBREDDITS, KEYWORDS } from '@/lib/reddit/config';
import { SCAN_FREQUENCIES, SCAN_FREQUENCY_LABELS, type ScanFrequency } from '@/lib/validations/settings';

export default function SettingsPage() {
  const [subreddits, setSubreddits] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [scanFrequency, setScanFrequency] = useState<ScanFrequency>('disabled');
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [notificationThreshold, setNotificationThreshold] = useState(70);
  const [skipToxicThreads, setSkipToxicThreads] = useState(true);
  const [hnEnabled, setHnEnabled] = useState(false);
  const [hnKeywords, setHnKeywords] = useState<string[]>([]);
  const [hnKeywordInput, setHnKeywordInput] = useState('');
  const [phEnabled, setPhEnabled] = useState(false);
  const [isCustom, setIsCustom] = useState({ subreddits: false, keywords: false });
  const [subredditInput, setSubredditInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      setSubreddits(data.subreddits);
      setKeywords(data.keywords);
      setScanFrequency(data.scan_frequency ?? 'disabled');
      setEmailNotifications(data.email_notifications ?? false);
      setNotificationThreshold(data.notification_threshold ?? 70);
      setSkipToxicThreads(data.skip_toxic_threads ?? true);
      setHnEnabled(data.hn_enabled ?? false);
      setHnKeywords(data.hn_keywords ?? data.keywords ?? []);
      setPhEnabled(data.ph_enabled ?? false);
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
        body: JSON.stringify({
          subreddits,
          keywords,
          scan_frequency: scanFrequency,
          email_notifications: emailNotifications,
          notification_threshold: notificationThreshold,
          skip_toxic_threads: skipToxicThreads,
          hn_enabled: hnEnabled,
          hn_keywords: hnKeywords.length > 0 ? hnKeywords : null,
          ph_enabled: phEnabled,
        }),
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
      setScanFrequency('disabled');
      setIsCustom({ subreddits: false, keywords: false });
      setMessage({ type: 'success', text: 'Reset to defaults' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to reset settings' });
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    setMessage(null);
    try {
      const res = await fetch('/api/notifications/test', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send test email');
      setMessage({ type: 'success', text: 'Test email sent! Check your inbox.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send test email' });
    } finally {
      setSendingTest(false);
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

      {/* Scan Frequency */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Scheduled Scanning</h2>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <p className="text-sm text-slate-400 mb-3">
            Automatically scan for new opportunities on a schedule. The local scanner worker must be running to process scans.
          </p>
          <select
            value={scanFrequency}
            onChange={(e) => setScanFrequency(e.target.value as ScanFrequency)}
            disabled={saving}
            className="w-full sm:w-auto bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            {SCAN_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>
                {SCAN_FREQUENCY_LABELS[freq]}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Email Notifications */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Email Notifications</h2>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Enable email notifications</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive an email when high-confidence opportunities are found
              </p>
            </div>
            <button
              role="switch"
              aria-checked={emailNotifications}
              onClick={() => setEmailNotifications(!emailNotifications)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${
                emailNotifications ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {emailNotifications && (
            <>
              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-slate-300">Confidence threshold</label>
                  <span className="text-sm font-mono text-blue-400">{notificationThreshold}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={notificationThreshold}
                  onChange={(e) => setNotificationThreshold(Number(e.target.value))}
                  disabled={saving}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Only notify for opportunities with confidence &ge; {notificationThreshold}%
                </p>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <button
                  onClick={sendTestEmail}
                  disabled={sendingTest || saving}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {sendingTest ? 'Sending...' : 'Send test email'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Sentiment Filter */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Content Filtering</h2>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Skip toxic threads</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically filter out hostile or toxic threads during scanning
              </p>
            </div>
            <button
              role="switch"
              aria-checked={skipToxicThreads}
              onClick={() => setSkipToxicThreads(!skipToxicThreads)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${
                skipToxicThreads ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  skipToxicThreads ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Hacker News */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Hacker News</h2>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Enable Hacker News scanning</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan Ask HN, Show HN, and top stories for opportunities
              </p>
            </div>
            <button
              role="switch"
              aria-checked={hnEnabled}
              onClick={() => setHnEnabled(!hnEnabled)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${
                hnEnabled ? 'bg-orange-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  hnEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {hnEnabled && (
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm text-slate-300">HN Keywords</label>
                <span className="text-xs text-slate-500">({hnKeywords.length})</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Custom keywords for HN scanning. Leave empty to use your Reddit keywords.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {hnKeywords.map((kw) => (
                  <span
                    key={kw}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-orange-300 text-sm rounded-full"
                  >
                    {kw}
                    <button
                      onClick={() => removeTag(kw, hnKeywords, setHnKeywords)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={hnKeywordInput}
                onChange={(e) => setHnKeywordInput(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, hnKeywordInput, hnKeywords, setHnKeywords, setHnKeywordInput)}
                placeholder="Add HN keyword (press Enter)"
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>
      </section>

      {/* Product Hunt */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Product Hunt</h2>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white font-medium">Enable Product Hunt scanning</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan top Product Hunt posts and discussions for opportunities
              </p>
            </div>
            <button
              role="switch"
              aria-checked={phEnabled}
              onClick={() => setPhEnabled(!phEnabled)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${
                phEnabled ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  phEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {phEnabled && (
            <div className="border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500">
                Requires a <code className="text-pink-400">PRODUCT_HUNT_API_KEY</code> environment variable.
                Get one from the Product Hunt API dashboard. Scanning will be skipped if no key is configured.
              </p>
            </div>
          )}
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
