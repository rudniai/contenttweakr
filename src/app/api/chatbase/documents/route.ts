import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getServiceClient, getChatbot } from '@/lib/chatbase/db';
import { ingestDocument } from '@/lib/chatbase/ingestion';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = request.headers.get('content-type') ?? '';

    let chatbotId: string;
    let sourceType: 'file' | 'url';
    let filename: string;
    let sourceUrl: string | null = null;
    let rawText: string | null = null;
    let mimeType: string | null = null;

    if (contentType.includes('multipart/form-data')) {
      // --- File upload ---
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      chatbotId = formData.get('chatbot_id') as string;

      if (!chatbotId) {
        return NextResponse.json({ error: 'chatbot_id is required' }, { status: 400 });
      }
      if (!file) {
        return NextResponse.json({ error: 'file is required' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 413 });
      }

      sourceType = 'file';
      filename = file.name;
      mimeType = file.type || null;
      rawText = await file.text();
    } else {
      // --- JSON (URL ingestion) ---
      const body = await request.json();
      chatbotId = body.chatbot_id;
      const url: string = body.url;
      const name: string | undefined = body.name;

      if (!chatbotId) {
        return NextResponse.json({ error: 'chatbot_id is required' }, { status: 400 });
      }
      if (!url) {
        return NextResponse.json({ error: 'url is required' }, { status: 400 });
      }

      sourceType = 'url';
      sourceUrl = url;
      filename = name ?? url;
    }

    // Verify chatbot belongs to user
    const chatbot = await getChatbot(chatbotId, user.id);
    if (!chatbot) return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });

    // Insert document record with status 'pending'
    const db = getServiceClient();
    const { data: doc, error: insertError } = await db
      .from('cb_documents')
      .insert({
        chatbot_id: chatbotId,
        user_id: user.id,
        filename,
        source_type: sourceType,
        source_url: sourceUrl,
        mime_type: mimeType,
        raw_text: rawText,
        status: 'pending',
        chunk_count: 0,
      })
      .select('*')
      .single();

    if (insertError || !doc) {
      console.error('[documents] POST insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
    }

    // Trigger ingestion asynchronously — do not await
    try {
      ingestDocument(doc.id as string).catch((err: unknown) => {
        console.error('[documents] Background ingestion error:', err);
      });
    } catch (err) {
      console.error('[documents] Failed to kick off ingestion:', err);
    }

    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('[documents] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
