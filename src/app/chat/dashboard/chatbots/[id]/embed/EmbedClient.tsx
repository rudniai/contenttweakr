'use client';

import { useState } from 'react';
import type { Chatbot } from '@/lib/chatbase/db';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 text-xs font-medium bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex-shrink-0"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function EmbedClient({ chatbot, isPaidPlan }: { chatbot: Chatbot; isPaidPlan: boolean }) {
  const [previewColor, setPreviewColor] = useState(chatbot.primary_color ?? '#6366f1');
  const [previewWelcome, setPreviewWelcome] = useState(chatbot.welcome_message ?? 'Hi! How can I help?');

  const scriptSnippet = `<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/chat/widget.js" data-chatbot-id="${chatbot.id}"${isPaidPlan ? ' data-hide-badge="true"' : ''}></script>`;

  const apiEndpoint = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/chat/chat`;

  const apiExample = `// Send a message via API
const response = await fetch('${apiEndpoint}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatbotId: '${chatbot.id}',
    sessionId: 'your-session-id',
    message: 'Hello!'
  })
});
const { reply } = await response.json();`;

  return (
    <div className="space-y-6">
      {/* Widget Snippet */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Widget Embed</h2>
        <p className="text-sm text-gray-500 mb-4">
          Paste this snippet just before the closing{' '}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">&lt;/body&gt;</code> tag on any page.
        </p>
        <div className="flex items-start gap-3">
          <pre className="flex-1 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
            {scriptSnippet}
          </pre>
          <CopyButton text={scriptSnippet} />
        </div>
      </div>

      {/* Customization Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Customization Preview</h2>
        <p className="text-sm text-gray-500 mb-4">
          See how your widget looks with different settings.
        </p>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={previewColor}
                  onChange={(e) => setPreviewColor(e.target.value)}
                  className="h-9 w-16 cursor-pointer rounded-lg border border-gray-300 p-0.5"
                />
                <span className="text-sm text-gray-500 font-mono">{previewColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Welcome Message</label>
              <input
                type="text"
                value={previewWelcome}
                onChange={(e) => setPreviewWelcome(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Mini chat preview */}
          <div className="flex-shrink-0">
            <div className="w-64 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header */}
              <div
                className="px-4 py-3 flex items-center gap-2"
                style={{ backgroundColor: previewColor }}
              >
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                    <path d="M3.505 2.365A41.369 41.369 0 019 2c1.863 0 3.697.124 5.495.365 1.247.167 2.18 1.108 2.435 2.268a4.45 4.45 0 00-.577-.069 43.141 43.141 0 00-4.706 0C9.229 4.696 7.5 6.727 7.5 9.167v.1c0 1.153.4 2.209 1.068 3.037.053.063.109.124.166.183-.03.016-.06.031-.09.047a3.977 3.977 0 01-1.334.157 4.757 4.757 0 01-1.54-.26l-1.597.614a.75.75 0 01-.966-.606l-.157-1.538a4.5 4.5 0 01-.832-2.61V4.5c0-1.217.86-2.283 2.187-2.465z" />
                    <path d="M14 6c-.762 0-1.52.02-2.271.063C10.157 6.148 9 7.472 9 9.167v.1c0 1.793 1.257 3.24 2.902 3.38a41.458 41.458 0 005.196 0C18.743 12.508 20 11.06 20 9.267v-.1c0-1.795-1.257-3.18-2.902-3.323A41.413 41.413 0 0014 6z" />
                  </svg>
                </div>
                <span className="text-white text-sm font-semibold">{chatbot.name}</span>
              </div>
              {/* Body */}
              <div className="bg-gray-50 px-3 py-4 min-h-[80px] flex items-end">
                <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm border border-gray-100 max-w-[80%]">
                  <p className="text-xs text-gray-700">{previewWelcome}</p>
                </div>
              </div>
              {/* Input */}
              <div className="bg-white px-3 py-2 border-t border-gray-100 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Type a message..."
                  disabled
                  className="flex-1 text-xs text-gray-400 bg-transparent outline-none"
                />
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: previewColor }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="w-3 h-3">
                    <path d="M2.87 2.298a.75.75 0 00-.812 1.021L3.39 6.624a1 1 0 00.928.626H8.25a.75.75 0 010 1.5H4.318a1 1 0 00-.927.626l-1.333 3.305a.75.75 0 00.812 1.022 24.89 24.89 0 0011.668-5.115.75.75 0 000-1.175A24.89 24.89 0 002.869 2.298z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          To apply these settings, update them in the <strong>Settings</strong> tab and save.
        </p>
      </div>

      {/* API Access */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">API Access</h2>
        <p className="text-sm text-gray-500 mb-4">
          Integrate your chatbot programmatically using the REST API.
        </p>
        <div className="mb-2 flex items-center gap-2">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 flex-1 truncate">
            POST {apiEndpoint}
          </code>
          <CopyButton text={apiEndpoint} />
        </div>
        <div className="flex items-start gap-3 mt-3">
          <pre className="flex-1 bg-gray-900 text-green-400 text-xs rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
            {apiExample}
          </pre>
          <CopyButton text={apiExample} />
        </div>
      </div>
    </div>
  );
}
