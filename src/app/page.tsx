import Link from 'next/link'
import Image from 'next/image'

const products = [
  {
    id: 'chat',
    name: 'ContentTweakr Chat',
    tagline: 'AI chatbot builder trained on your content',
    description:
      'Upload your docs, add your URLs, and deploy a smart AI chatbot to your website in minutes. Your customers get instant, accurate answers — 24/7.',
    status: 'live' as const,
    href: '/chat',
    color: 'indigo',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 00-1.032-.211 50.89 50.89 0 00-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 002.433 3.984L7.28 21.53A.75.75 0 016 21v-4.03a48.527 48.527 0 01-1.087-.128C2.905 16.58 1.5 14.833 1.5 12.862V6.638c0-1.97 1.405-3.718 3.413-3.979z" />
        <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 001.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0015.75 7.5z" />
      </svg>
    ),
  },
  {
    id: 'write',
    name: 'ContentTweakr Write',
    tagline: 'AI blog & article writer, SEO-optimized',
    description:
      'Generate long-form blog posts, articles, and landing page copy that rank on Google. Train it on your brand voice and watch it produce content that sounds like you.',
    status: 'coming_soon' as const,
    href: '#waitlist',
    color: 'violet',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" />
        <path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" />
      </svg>
    ),
  },
  {
    id: 'social',
    name: 'ContentTweakr Social',
    tagline: 'AI social media content generator',
    description:
      'Create scroll-stopping posts for Twitter/X, LinkedIn, and Instagram at scale. Schedule a week of content in minutes — consistent tone, on-brand every time.',
    status: 'coming_soon' as const,
    href: '#waitlist',
    color: 'pink',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM6.262 6.072a8.25 8.25 0 1010.562-.766 4.5 4.5 0 01-1.318 1.357L14.25 7.5l.165.33a.809.809 0 01-1.086 1.085l-.604-.302a1.125 1.125 0 00-1.298.21l-.132.131c-.439.44-.439 1.152 0 1.591l.296.296c.256.257.622.374.98.314l1.17-.195c.323-.054.654.036.905.245l1.33 1.108c.32.267.46.694.358 1.1a8.7 8.7 0 01-2.288 4.04l-.723.724a1.125 1.125 0 01-1.298.21l-.153-.076a1.125 1.125 0 01-.622-1.006v-1.089c0-.298-.119-.585-.33-.796l-1.347-1.347a1.125 1.125 0 01-.21-1.298L9.75 12l-1.64-1.64a6 6 0 01-1.676-3.257l-.172-1.03z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    id: 'email',
    name: 'ContentTweakr Email',
    tagline: 'AI email campaigns & newsletters',
    description:
      'Write high-converting email sequences, newsletters, and drip campaigns. Personalize at scale without losing the human touch that gets replies.',
    status: 'coming_soon' as const,
    href: '#waitlist',
    color: 'emerald',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M1.5 8.67v8.58a3 3 0 003 3h15a3 3 0 003-3V8.67l-8.928 5.493a3 3 0 01-3.144 0L1.5 8.67z" />
        <path d="M22.5 6.908V6.75a3 3 0 00-3-3h-15a3 3 0 00-3 3v.158l9.714 5.978a1.5 1.5 0 001.572 0L22.5 6.908z" />
      </svg>
    ),
  },
  {
    id: 'video',
    name: 'ContentTweakr Video',
    tagline: 'AI video scripts & outlines',
    description:
      'Generate YouTube scripts, TikTok briefs, and explainer video outlines optimized for watch time and engagement. Turn any topic into a bingeable series.',
    status: 'coming_soon' as const,
    href: '#waitlist',
    color: 'amber',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
      </svg>
    ),
  },
]

const colorMap = {
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  violet: {
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    btn: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    btn: 'bg-pink-600 hover:bg-pink-700 text-white',
  },
  emerald: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    btn: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
}

export default function SuiteLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ContentTweakr" width={160} height={32} priority />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#products" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Products
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              How it works
            </a>
            <a href="#waitlist" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Early access
            </a>
          </nav>
          <div className="flex items-center gap-3">
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
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 pt-20 pb-28">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-50 rounded-full blur-3xl opacity-60" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            Chat is live — Write, Social, Email &amp; Video coming soon
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight mb-6">
            One toolkit.
            <br />
            <span className="text-indigo-600">
              Every content channel.
            </span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            ContentTweakr is the AI-powered content suite built for businesses that want to
            dominate organic channels — chat, blog, social, email, and video — without hiring
            a content team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/chat/signup"
              className="w-full sm:w-auto px-8 py-3.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              Start with Chat — free
            </Link>
            <a
              href="#products"
              className="w-full sm:w-auto px-8 py-3.5 text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Explore the suite
            </a>
          </div>
          <p className="text-xs text-gray-400 mt-4">No credit card required. Up and running in 5 minutes.</p>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The complete content toolkit
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Five integrated tools, one subscription. Each tool feeds the others — content you
              create trains your chatbot, chatbot conversations inspire new blog posts, and so on.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const colors = colorMap[product.color as keyof typeof colorMap]
              return (
                <div
                  key={product.id}
                  className={`relative rounded-2xl border-2 p-6 flex flex-col transition-shadow hover:shadow-lg ${
                    product.status === 'live' ? 'border-indigo-200 shadow-md' : 'border-gray-100'
                  }`}
                >
                  {product.status === 'live' && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full shadow">
                        Live Now
                      </span>
                    </div>
                  )}
                  {product.status === 'coming_soon' && (
                    <div className="absolute -top-3 left-6">
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full border border-gray-200">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center mb-5 mt-2`}>
                    {product.icon}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                  <p className={`text-xs font-semibold ${colors.text} mb-3`}>{product.tagline}</p>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-6">
                    {product.description}
                  </p>

                  {product.status === 'live' ? (
                    <Link
                      href={product.href}
                      className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-colors ${colors.btn}`}
                    >
                      Get started free
                    </Link>
                  ) : (
                    <a
                      href="#waitlist"
                      className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Join waitlist
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Built for the content flywheel
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              ContentTweakr tools are designed to reinforce each other. The more you use them
              together, the more powerful your content engine becomes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create with AI',
                desc: 'Generate high-quality content across every channel using AI trained on your brand voice, docs, and tone.',
                color: 'text-indigo-600',
                bg: 'bg-indigo-50',
              },
              {
                step: '02',
                title: 'Distribute everywhere',
                desc: 'Publish to your website, social channels, email lists, and customer support — all from one platform.',
                color: 'text-violet-600',
                bg: 'bg-violet-50',
              },
              {
                step: '03',
                title: 'Train your chatbot',
                desc: 'Every piece of content you create automatically strengthens your AI chatbot with fresh, accurate knowledge.',
                color: 'text-pink-600',
                bg: 'bg-pink-50',
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className={`inline-flex items-center justify-center w-10 h-10 ${item.bg} rounded-xl mb-4`}>
                  <span className={`text-sm font-bold ${item.color}`}>{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-24 bg-indigo-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Be first when Write, Social, Email &amp; Video launch
          </h2>
          <p className="text-indigo-200 mb-10 text-lg">
            Join the waitlist and get early access, founding-member pricing, and a chance to
            shape the product roadmap.
          </p>
          <form
            action="https://formspree.io/f/waitlist"
            method="POST"
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              name="email"
              required
              placeholder="your@email.com"
              className="flex-1 px-4 py-3 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-colors whitespace-nowrap"
            >
              Notify me
            </button>
          </form>
          <p className="text-indigo-300 text-xs mt-4">
            No spam. Unsubscribe anytime. We&apos;ll only email you about product updates.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Suite economics beat point solutions</h2>
          <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
            Most AI chat tools charge $19–99/mo for chat alone. ContentTweakr gives you chat today —
            plus Write, Social, Email, and Video as they launch — all in one subscription.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Starter',
                price: '$0',
                period: 'forever',
                features: ['1 chatbot', '20 documents', '500 chat messages/mo', 'Early Write access'],
                cta: 'Get started',
                href: '/chat/signup',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$49',
                period: 'per month',
                features: ['Unlimited chatbots', '500 documents', '10,000 messages/mo', 'All suite tools', 'Custom branding', 'Priority support'],
                cta: 'Start Pro trial',
                href: '/chat/signup',
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                features: ['Everything in Pro', 'Unlimited usage', 'Dedicated onboarding', 'SLA + SSO', 'Custom integrations'],
                cta: 'Contact us',
                href: 'mailto:hello@contenttweakr.com',
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-indigo-500 shadow-xl shadow-indigo-100'
                    : 'border-gray-100'
                }`}
              >
                {plan.highlight && (
                  <div className="text-center mb-3">
                    <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-sm text-gray-400 ml-1">{plan.period}</span>}
                </div>
                <ul className="flex-1 space-y-2.5 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-center transition-colors ${
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

      {/* Final CTA */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Start your content engine today
          </h2>
          <p className="text-gray-500 mb-8">
            Deploy your first AI chatbot in under 5 minutes — no code, no credit card.
          </p>
          <Link
            href="/chat/signup"
            className="inline-block px-8 py-3.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="ContentTweakr" width={140} height={28} />
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/chat" className="hover:text-gray-600 transition-colors">Chat</Link>
            <Link href="/chat/login" className="hover:text-gray-600 transition-colors">Sign in</Link>
            <a href="mailto:hello@contenttweakr.com" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} ContentTweakr. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
