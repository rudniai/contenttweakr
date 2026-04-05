'use client';

import { useState } from 'react';
import type { Plan, Subscription } from '@/lib/chatbase/db';

function formatPrice(cents: number) {
  if (cents === 0) return 'Free';
  return `$${(cents / 100).toFixed(0)}/mo`;
}

function formatLimit(value: number | null, unit: string) {
  if (value === null) return 'Unlimited';
  return `${value.toLocaleString()} ${unit}`;
}

const PLAN_FEATURES: Record<string, string[]> = {
  Free: ['1 chatbot', '20 documents', '500 messages/month', 'Community support'],
  Pro: ['5 chatbots', '200 documents', '5,000 messages/month', 'Email support', 'Custom branding'],
  Enterprise: [
    'Unlimited chatbots',
    'Unlimited documents',
    'Unlimited messages',
    'Priority support',
    'Custom integrations',
    'SLA guarantee',
  ],
};

export default function BillingClient({
  plans,
  subscription,
}: {
  plans: Plan[];
  subscription: (Subscription & { plan: Plan }) | null;
}) {
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentPlanId = subscription?.plan_id ?? null;

  async function handleUpgrade(planId: string) {
    setLoadingPlanId(planId);
    setError(null);

    try {
      const res = await fetch('/api/chat/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Checkout failed');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoadingPlanId(null);
    }
  }

  // Determine plan tier order for upgrade logic
  const planOrder = plans.map((p) => p.id);

  function isCurrentPlan(planId: string) {
    return planId === currentPlanId;
  }

  function isDowngrade(planId: string) {
    if (!currentPlanId) return false;
    const currentIdx = planOrder.indexOf(currentPlanId);
    const targetIdx = planOrder.indexOf(planId);
    return targetIdx < currentIdx;
  }

  return (
    <div className="space-y-6">
      {/* Current subscription status */}
      {subscription && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-5 py-4 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <div>
            <p className="text-sm font-medium text-indigo-900">
              Current plan:{' '}
              <span className="font-bold">{subscription.plan?.name ?? 'Unknown'}</span>
            </p>
            {subscription.current_period_end && (
              <p className="text-xs text-indigo-600 mt-0.5">
                Renews on{' '}
                {new Date(subscription.current_period_end).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan, index) => {
          const isCurrent = isCurrentPlan(plan.id);
          const isFree = plan.price_monthly_cents === 0;
          const isPopular = index === 1; // Middle plan is "Pro"
          const features =
            PLAN_FEATURES[plan.name] ?? [
              formatLimit(plan.chatbot_limit, 'chatbots'),
              formatLimit(plan.document_limit, 'documents'),
              formatLimit(plan.message_limit, 'messages/month'),
            ];

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-xl border-2 p-6 flex flex-col ${
                isCurrent
                  ? 'border-indigo-500 shadow-md'
                  : isPopular && !isCurrent
                  ? 'border-indigo-200'
                  : 'border-gray-200'
              }`}
            >
              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-indigo-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  {formatPrice(plan.price_monthly_cents)}
                </p>
              </div>

              {/* Features */}
              <ul className="flex-1 space-y-2 mb-6">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent || isFree ? (
                <button
                  disabled
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 cursor-default"
                >
                  {isCurrent ? 'Current Plan' : 'Free'}
                </button>
              ) : isDowngrade(plan.id) ? (
                <button
                  disabled
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium border border-gray-200 text-gray-400 cursor-default"
                >
                  Downgrade
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingPlanId !== null}
                  className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loadingPlanId === plan.id && (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {loadingPlanId === plan.id ? 'Redirecting...' : 'Upgrade'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Fallback when no plans loaded */}
      {plans.length === 0 && (
        <div className="text-center py-12 text-sm text-gray-400">
          Pricing information is not available right now.
        </div>
      )}
    </div>
  );
}
