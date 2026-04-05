import Link from 'next/link';
import Script from 'next/script';

export default function ChatbaseLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-indigo-600"
            >
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
            </svg>
            <span className="text-lg font-bold text-gray-900">Chatbase</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/chatbase/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/chatbase/signup"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          AI-powered chatbots for your website
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6">
          Build a chatbot trained
          <br />
          on your own content
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
          Upload your documents, add your URLs, and deploy an AI chatbot to your website in
          minutes — no coding required.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/chatbase/signup"
            className="px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Start for free
          </Link>
          <Link
            href="#how-it-works"
            className="px-6 py-3 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            See how it works
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
            Everything you need
          </h2>
          <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
            From document ingestion to live chat widget — a complete platform for custom AI
            chatbots.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M5.625 1.5H9a3.75 3.75 0 013.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 013.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875zM9.75 14.25a.75.75 0 000 1.5H15a.75.75 0 000-1.5H9.75z" clipRule="evenodd" />
                    <path d="M14.25 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0016.5 7.5h-1.875a.375.375 0 01-.375-.375V5.25z" />
                  </svg>
                ),
                title: 'Upload your docs',
                description:
                  'Add PDFs, text files, markdown, or URLs. We process and embed your content automatically.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
                    <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
                  </svg>
                ),
                title: 'Customize your bot',
                description:
                  'Set a system prompt, welcome message, brand color, and fallback behavior in seconds.',
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M14.447 3.027a.75.75 0 01.527.92l-4.5 16.5a.75.75 0 01-1.448-.394l4.5-16.5a.75.75 0 01.921-.526zM16.72 6.22a.75.75 0 011.06 0l5.25 5.25a.75.75 0 010 1.06l-5.25 5.25a.75.75 0 11-1.06-1.06L21.44 12l-4.72-4.72a.75.75 0 010-1.06zm-9.44 0a.75.75 0 010 1.06L2.56 12l4.72 4.72a.75.75 0 11-1.06 1.06L.97 12.53a.75.75 0 010-1.06l5.25-5.25a.75.75 0 011.06 0z" clipRule="evenodd" />
                  </svg>
                ),
                title: 'Embed anywhere',
                description:
                  'Paste one script tag into your site and your AI chat widget goes live instantly.',
              },
            ].map((feature) => (
              <div key={feature.title} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Simple pricing</h2>
          <p className="text-gray-500 text-center mb-12">Start free, scale as you grow.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Free',
                price: '$0',
                features: ['1 chatbot', '20 documents', '500 messages/month', 'Community support'],
                cta: 'Get started',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$29/mo',
                features: ['5 chatbots', '200 documents', '5,000 messages/month', 'Email support', 'Custom branding'],
                cta: 'Start Pro',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                features: ['Unlimited chatbots', 'Unlimited documents', 'Unlimited messages', 'Priority support', 'SLA guarantee'],
                cta: 'Contact us',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  plan.highlight ? 'border-indigo-500 shadow-lg' : 'border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-3xl font-extrabold text-gray-900 mb-4">{plan.price}</p>
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500 flex-shrink-0">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/chatbase/signup"
                  className={`w-full py-2 px-4 rounded-xl text-sm font-semibold text-center transition-colors ${
                    plan.highlight
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to build your first chatbot?
          </h2>
          <p className="text-indigo-200 mb-8">
            Sign up for free — no credit card required.
          </p>
          <Link
            href="/chatbase/signup"
            className="inline-block px-8 py-3 bg-white text-indigo-600 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-colors shadow-sm"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-600">
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
            </svg>
            <span className="text-sm font-semibold text-gray-700">Chatbase</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Chatbase. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Chatbase demo widget */}
      <Script
        src="/api/chatbase/widget.js"
        data-chatbot-id="013af73e-3846-46a7-80d3-45c15a72e83e"
        strategy="lazyOnload"
      />
    </div>
  );
}
