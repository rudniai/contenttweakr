'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Chatbot } from '@/lib/chatbase/db';

type Message = {
  role: 'user' | 'bot';
  content: string;
  streaming?: boolean;
};

function generateSessionId() {
  return `test-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export default function TestPanel({ chatbot }: { chatbot: Chatbot }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', content: chatbot.welcome_message ?? 'Hi! How can I help?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    // Add streaming bot placeholder
    setMessages((prev) => [...prev, { role: 'bot', content: '', streaming: true }]);

    try {
      const res = await fetch('/api/chat/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatbot_id: chatbot.id,
          session_id: sessionId,
          message: text,
        }),
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? 'Failed to get response');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;
            try {
              const parsed = JSON.parse(raw);
              const chunk =
                parsed?.choices?.[0]?.delta?.content ??
                parsed?.content ??
                parsed?.text ??
                '';
              if (chunk) {
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.role === 'bot') {
                    next[next.length - 1] = { ...last, content: last.content + chunk, streaming: true };
                  }
                  return next;
                });
              }
            } catch {
              // non-JSON SSE line, skip
            }
          }
        }
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'bot') {
          next[next.length - 1] = {
            role: 'bot',
            content: err instanceof Error ? err.message : 'Something went wrong.',
            streaming: false,
          };
        }
        return next;
      });
    } finally {
      // Mark last bot message as done streaming
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === 'bot' && last.streaming) {
          next[next.length - 1] = { ...last, streaming: false };
        }
        return next;
      });
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, chatbot.id, sessionId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleReset() {
    setMessages([{ role: 'bot', content: chatbot.welcome_message ?? 'Hi! How can I help?' }]);
    setInput('');
    setLoading(false);
  }

  const primaryColor = chatbot.primary_color ?? '#6366f1';

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Chat window */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden" style={{ minHeight: 500, maxHeight: 680 }}>
        {/* Chat header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: primaryColor }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 9.167v.1c0 1.153.4 2.209 1.068 3.037.053.063.109.124.166.183-.03.016-.06.031-.09.047a3.977 3.977 0 01-1.334.157 4.757 4.757 0 01-1.54-.26l-1.597.614a.75.75 0 01-.966-.606l-.157-1.538a4.5 4.5 0 01-.832-2.61V4.5c0-1.217.86-2.283 2.187-2.465z" />
                <path d="M14 6c-.762 0-1.52.02-2.271.063C10.157 6.148 9 7.472 9 9.167v.1c0 1.793 1.257 3.24 2.902 3.38a41.458 41.458 0 005.196 0C18.743 12.508 20 11.06 20 9.267v-.1c0-1.795-1.257-3.18-2.902-3.323A41.413 41.413 0 0014 6z" />
              </svg>
            </div>
            <span className="text-white text-sm font-semibold">{chatbot.name}</span>
          </div>
          <button
            onClick={handleReset}
            className="text-white/70 hover:text-white text-xs transition-colors"
            title="Reset conversation"
          >
            Reset
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'text-white rounded-br-sm'
                    : 'bg-white text-gray-700 rounded-bl-sm shadow-sm border border-gray-100'
                }`}
                style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="inline-block w-1 h-3.5 bg-gray-400 ml-0.5 align-middle animate-pulse rounded-sm" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-3 py-2.5 bg-white border-t border-gray-100 flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={loading}
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-3.5 h-3.5">
                <path d="M2.87 2.298a.75.75 0 00-.812 1.021L3.39 6.624a1 1 0 00.928.626H8.25a.75.75 0 010 1.5H4.318a1 1 0 00-.927.626l-1.333 3.305a.75.75 0 00.812 1.022 24.89 24.89 0 0011.668-5.115.75.75 0 000-1.175A24.89 24.89 0 002.869 2.298z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Info panel */}
      <div className="lg:w-60 flex-shrink-0 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Session Info</h3>
          <div className="space-y-1.5">
            <div>
              <p className="text-xs text-gray-400">Session ID</p>
              <p className="text-xs font-mono text-gray-600 break-all">{sessionId}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Chatbot ID</p>
              <p className="text-xs font-mono text-gray-600 break-all">{chatbot.id}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Messages</p>
              <p className="text-xs text-gray-600">{messages.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-700">
            This test panel uses the same chat endpoint as your public widget. Messages are saved to your conversation logs.
          </p>
        </div>
      </div>
    </div>
  );
}
