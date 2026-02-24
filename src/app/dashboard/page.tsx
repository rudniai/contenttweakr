'use client';

import { useState, useEffect } from 'react';

export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const PLATFORMS = [
  { id: 'twitter', name: 'Twitter', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'instagram', name: 'Instagram', icon: '📷' },
  { id: 'email', name: 'Email', icon: '📧' },
  { id: 'reddit', name: 'Reddit', icon: '🤖' },
];

interface RepurposedContent {
  platform: string;
  content: string;
}

export default function DashboardPage() {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RepurposedContent[]>([]);
  const [error, setError] = useState('');
  const [usageCount, setUsageCount] = useState(0);
  const [isPro] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth/login');
      }
    };

    const fetchUsage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (data) {
        setUsageCount(data.count);
      }
    };

    checkAuth();
    fetchUsage();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleRepurpose = async () => {
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    if (selectedPlatforms.length === 0) {
      setError('Please select at least one platform');
      return;
    }

    if (!isPro && usageCount >= 5) {
      setError('Daily limit reached. Upgrade to Pro for unlimited repurposes!');
      return;
    }

    setError('');
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch('/api/repurpose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to repurpose content');
      }

      setResults(data.results);
      setUsageCount(prev => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const remainingUses = Math.max(0, 5 - usageCount);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <Image src="/logo.svg" alt="ContentTweakr" width={32} height={32} />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">ContentTweakr</h1>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-4">
              {!isPro && (
                <span className="text-xs sm:text-sm text-gray-600">
                  {remainingUses} free left today
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 font-medium text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            Repurpose Your Content
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="Paste your blog post, article, or any content you want to repurpose..."
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Platforms
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition ${
                    selectedPlatforms.includes(platform.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{platform.icon}</div>
                  <div className="text-xs sm:text-sm font-medium text-gray-900">
                    {platform.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            onClick={handleRepurpose}
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Repurposing...' : 'Repurpose Content'}
          </button>
        </div>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Your Repurposed Content
            </h2>
            {results.map((result) => {
              const platform = PLATFORMS.find(p => p.id === result.platform);
              return (
                <div key={result.platform} className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{platform?.icon}</span>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {platform?.name}
                      </h3>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.content)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{result.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
