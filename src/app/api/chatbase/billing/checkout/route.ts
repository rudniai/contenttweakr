import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createChatbaseServerClient } from '@/lib/chatbase/supabase-server';
import { getServiceClient } from '@/lib/chatbase/db';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Billing not configured' },
        { status: 503 }
      );
    }

    const supabase = createChatbaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { plan_id } = body;

    if (!plan_id) {
      return NextResponse.json({ error: 'plan_id is required' }, { status: 400 });
    }

    const db = getServiceClient();

    // Fetch plan to get stripe_price_id
    const { data: plan, error: planError } = await db
      .from('cb_plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    if (!plan.stripe_price_id) {
      return NextResponse.json({ error: 'Plan has no Stripe price configured' }, { status: 400 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // Check if user already has a stripe_customer_id
    const { data: existingSubscription } = await db
      .from('cb_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId: string | undefined = existingSubscription?.stripe_customer_id ?? undefined;

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: plan.stripe_price_id as string,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/dashboard/chatbase/billing?success=1`,
      cancel_url: `${appUrl}/dashboard/chatbase/billing?canceled=1`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: plan_id as string,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[billing/checkout] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
