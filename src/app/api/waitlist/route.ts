import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/chatbase/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, source } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const db = getServiceClient();
    const { error } = await db
      .from('waitlist_emails')
      .insert({ email: email.toLowerCase().trim(), source: source ?? 'landing' });

    // Silently ignore duplicate emails
    if (error && error.code !== '23505') {
      console.error('[waitlist] insert error:', error);
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[waitlist] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
