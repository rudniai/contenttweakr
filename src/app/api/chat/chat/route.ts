import { NextRequest } from 'next/server';
import { getChatbot } from '@/lib/chatbase/db';
import { createChatStream } from '@/lib/chatbase/chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatbot_id, session_id, message } = body;

    if (!chatbot_id || typeof chatbot_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'chatbot_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!session_id || typeof session_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'session_id is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return new Response(
        JSON.stringify({ error: 'message is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate chatbot exists (no userId — public endpoint)
    const chatbot = await getChatbot(chatbot_id);
    if (!chatbot) {
      return new Response(
        JSON.stringify({ error: 'Chatbot not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const stream = await createChatStream(chatbot_id, session_id, message.trim());

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[chat] POST error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
