import { redirect } from 'next/navigation';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient, type Plan, type Subscription } from '@/lib/chatbase/db';
import BillingClient from './BillingClient';

export default async function BillingPage() {
  const supabase = createChatbaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/chatbase/login');

  let plans: Plan[] = [];
  let subscription: (Subscription & { plan: Plan }) | null = null;

  try {
    const db = getServiceClient();
    const [{ data: plansData }, { data: subscriptionData }] = await Promise.all([
      db.from('cb_plans').select('*').order('price_monthly_cents', { ascending: true }),
      db
        .from('cb_subscriptions')
        .select('*, plan:cb_plans(*)')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);
    plans = (plansData ?? []) as Plan[];
    subscription = subscriptionData as (Subscription & { plan: Plan }) | null;
  } catch (err) {
    console.error('[chatbase/billing] DB error:', err);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription and usage limits.
        </p>
      </div>
      <BillingClient plans={plans} subscription={subscription} />
    </div>
  );
}
