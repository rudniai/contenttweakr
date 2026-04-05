import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TEMPLATES, getTemplateBySlug } from '@/lib/chatbase/templates';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) return {};
  return {
    title: `${template.name} Template — ContentTweakr Chat`,
    description: template.description,
  };
}

export default async function TemplateSlugPage({ params }: Props) {
  const { slug } = await params;
  const template = getTemplateBySlug(slug);
  if (!template) notFound();

  const truncatedPrompt =
    template.systemPrompt.length > 200
      ? template.systemPrompt.slice(0, 200) + '…'
      : template.systemPrompt;

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chat" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                  <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                  <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                </svg>
              </div>
              <span className="text-base font-bold text-gray-900">Chat</span>
            </Link>
            <span className="text-gray-300">/</span>
            <Link href="/chat/templates" className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">
              Templates
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium">{template.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/chat/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/chat/signup"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Icon + name */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100"
            style={{ backgroundColor: template.primaryColor + '18' }}
          >
            {template.icon}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">{template.name}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <p className="text-lg text-gray-500 leading-relaxed mb-10">{template.longDescription}</p>

        {/* Details */}
        <div className="space-y-6 mb-12">
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Welcome Message</h2>
            <p className="text-sm text-gray-600 italic">&ldquo;{template.welcomeMessage}&rdquo;</p>
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">System Prompt Preview</h2>
            <p className="text-sm text-gray-600 font-mono leading-relaxed">{truncatedPrompt}</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700">Primary Color</span>
            <div
              className="w-6 h-6 rounded-full border border-gray-200 shadow-sm"
              style={{ backgroundColor: template.primaryColor }}
            />
            <span className="text-sm text-gray-500 font-mono">{template.primaryColor}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href={`/chat/signup?template=${template.slug}`}
            className="flex-1 py-3 px-6 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-center shadow-sm"
          >
            Use this template — it&apos;s free
          </Link>
          <Link
            href={`/chat/login?template=${template.slug}`}
            className="flex-1 py-3 px-6 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
          >
            Sign in &amp; use template
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-3 text-center">No credit card required.</p>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/chat/templates" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors">
            ← All templates
          </Link>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ContentTweakr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
