'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard/reddit-finder')
      else setCheckingAuth(false)
    })
  }, [router, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.replace('/dashboard/reddit-finder')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const features = [
    { icon: '🔍', title: 'Smart Opportunity Detection', desc: 'AI scans thousands of posts to find threads where your product naturally fits the conversation.' },
    { icon: '🤖', title: 'Claude Opus-Powered Responses', desc: 'Generate authentic, context-aware replies that add genuine value — never spammy, always helpful.' },
    { icon: '📊', title: 'Real-time Scanning', desc: 'Monitor subreddits 24/7 and get instant alerts when high-potential opportunities appear.' },
    { icon: '✅', title: 'Ban-Proof Strategy', desc: 'Built-in compliance checks ensure every response follows subreddit rules and Reddit guidelines.' },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* Left — Login */}
      <div className="w-full lg:w-[480px] flex flex-col justify-center px-8 sm:px-12 lg:px-16 py-12 relative z-10">
        <div className="max-w-sm mx-auto w-full animate-[fadeIn_0.5s_ease-out]">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-blue-500/20">
              R
            </div>
            <span className="text-lg font-semibold tracking-tight text-slate-200">
              Reddit Intel
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight mb-2">Welcome back</h1>
          <p className="text-slate-400 text-sm mb-8">Sign in to your account to continue.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 text-sm text-red-400 animate-[fadeIn_0.2s_ease-out]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed px-3.5 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-xs text-slate-600 mt-8 text-center">
            Access is restricted to authorized users only.
          </p>
        </div>
      </div>

      {/* Right — Feature showcase */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-400/5 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 flex flex-col justify-center px-16 xl:px-24 max-w-2xl">
          <div className="animate-[fadeIn_0.6s_ease-out]">
            <h2 className="text-3xl xl:text-4xl font-semibold tracking-tight leading-tight mb-3">
              Reddit Marketing
              <br />
              <span className="text-blue-400">Intelligence</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed mb-12 max-w-md">
              Find genuine opportunities. Generate human-like responses. Build karma organically.
            </p>

            <div className="space-y-6">
              {features.map((f, i) => (
                <div
                  key={f.title}
                  className="flex gap-4 group animate-[fadeIn_0.5s_ease-out]"
                  style={{ animationDelay: `${(i + 1) * 100}ms`, animationFillMode: 'both' }}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-lg group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-slate-200 mb-0.5">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global keyframes via inline style */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
