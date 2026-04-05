import { NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/chatbase/db';

export async function GET() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from('cb_plans')
      .select('*')
      .order('price_monthly_cents', { ascending: true });

    if (error) {
      console.error('[billing/plans] GET error:', error);
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[billing/plans] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
