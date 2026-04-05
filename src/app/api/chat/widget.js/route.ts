import { NextResponse } from 'next/server';

const WIDGET_JS = `(function() {
  'use strict';

  var script = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var chatbotId = script.getAttribute('data-chatbot-id');
  var primaryColor = script.getAttribute('data-primary-color') || '#6366f1';
  var welcomeMessage = script.getAttribute('data-welcome-message') || 'Hi! How can I help you today?';
  var apiUrl = script.getAttribute('data-api-url') || (script.src.replace('/api/chat/widget.js', '') + '/api/chat/chat');
  var hideBadge = script.getAttribute('data-hide-badge') !== null;

  if (!chatbotId) {
    console.error('[Chatbase] Missing data-chatbot-id attribute');
    return;
  }

  var sessionId = (function() {
    var key = 'cb_session_' + chatbotId;
    var id = sessionStorage.getItem(key);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(key, id);
    }
    return id;
  })();

  var messages = [];
  var isOpen = false;
  var isLoading = false;

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '.cb-bubble{position:fixed;bottom:24px;right:24px;width:56px;height:56px;border-radius:50%;background:' + primaryColor + ';border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.2);z-index:2147483647;display:flex;align-items:center;justify-content:center;transition:transform .2s}',
    '.cb-bubble:hover{transform:scale(1.05)}',
    '.cb-bubble svg{fill:white;width:24px;height:24px}',
    '.cb-panel{position:fixed;bottom:96px;right:24px;width:380px;max-width:calc(100vw - 48px);height:560px;max-height:calc(100vh - 120px);background:white;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,.15);z-index:2147483646;display:none;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '.cb-panel.cb-open{display:flex}',
    '.cb-header{background:' + primaryColor + ';color:white;padding:16px;font-weight:600;font-size:15px;display:flex;align-items:center;gap:8px}',
    '.cb-header-dot{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.7)}',
    '.cb-messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}',
    '.cb-msg{max-width:80%;padding:10px 14px;border-radius:12px;font-size:14px;line-height:1.5}',
    '.cb-msg.cb-user{align-self:flex-end;background:' + primaryColor + ';color:white;border-bottom-right-radius:4px}',
    '.cb-msg.cb-bot{align-self:flex-start;background:#f3f4f6;color:#111;border-bottom-left-radius:4px}',
    '.cb-msg.cb-typing{color:#9ca3af}',
    '.cb-input-row{padding:12px 16px;border-top:1px solid #e5e7eb;display:flex;gap:8px}',
    '.cb-input{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:8px 12px;font-size:14px;outline:none;resize:none;height:40px;font-family:inherit}',
    '.cb-input:focus{border-color:' + primaryColor + '}',
    '.cb-send{background:' + primaryColor + ';color:white;border:none;border-radius:8px;padding:0 16px;cursor:pointer;font-size:14px;font-weight:500;white-space:nowrap}',
    '.cb-send:disabled{opacity:.5;cursor:not-allowed}',
    '.cb-powered-by{text-align:center;padding:6px 12px;font-size:11px;color:#9ca3af;background:#fff;border-top:1px solid #e5e7eb}',
    '.cb-powered-by a{color:#6366f1;text-decoration:none}',
    '.cb-powered-by a:hover{text-decoration:underline}'
  ].join('');
  document.head.appendChild(style);

  // Create bubble
  var bubble = document.createElement('button');
  bubble.className = 'cb-bubble';
  bubble.setAttribute('aria-label', 'Open chat');
  bubble.innerHTML = '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  // Create panel
  var panel = document.createElement('div');
  panel.className = 'cb-panel';
  panel.innerHTML = [
    '<div class="cb-header"><div class="cb-header-dot"></div><span>Chat Support</span></div>',
    '<div class="cb-messages" id="cb-messages-' + chatbotId + '"></div>',
    '<div class="cb-input-row">',
    '<textarea class="cb-input" id="cb-input-' + chatbotId + '" placeholder="Type a message..." rows="1"></textarea>',
    '<button class="cb-send" id="cb-send-' + chatbotId + '">Send</button>',
    '</div>',
    hideBadge ? '' : '<div class="cb-powered-by">Powered by <a href="https://contenttweakr.com/?utm_source=widget&utm_medium=badge&utm_campaign=powered_by" target="_blank" rel="noopener">ContentTweakr</a></div>'
  ].join('');

  document.body.appendChild(bubble);
  document.body.appendChild(panel);

  var messagesEl = document.getElementById('cb-messages-' + chatbotId);
  var inputEl = document.getElementById('cb-input-' + chatbotId);
  var sendBtn = document.getElementById('cb-send-' + chatbotId);

  function addMessage(role, text) {
    var div = document.createElement('div');
    div.className = 'cb-msg cb-' + role;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  function togglePanel() {
    isOpen = !isOpen;
    if (isOpen) {
      panel.classList.add('cb-open');
      if (messages.length === 0) addMessage('bot', welcomeMessage);
      inputEl.focus();
    } else {
      panel.classList.remove('cb-open');
    }
  }

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text || isLoading) return;
    inputEl.value = '';
    messages.push({ role: 'user', content: text });
    addMessage('user', text);
    isLoading = true;
    sendBtn.disabled = true;
    var typingDiv = addMessage('bot', '...');
    typingDiv.classList.add('cb-typing');

    fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatbot_id: chatbotId, session_id: sessionId, message: text })
    }).then(function(res) {
      if (!res.ok) throw new Error('Request failed');
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var botText = '';
      typingDiv.classList.remove('cb-typing');
      typingDiv.textContent = '';

      function read() {
        reader.read().then(function(result) {
          if (result.done) {
            isLoading = false;
            sendBtn.disabled = false;
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          var lines = buffer.split('\\n');
          buffer = lines.pop();
          lines.forEach(function(line) {
            if (!line.startsWith('data: ')) return;
            try {
              var evt = JSON.parse(line.slice(6));
              if (evt.type === 'chunk') {
                botText += evt.text;
                typingDiv.textContent = botText;
                messagesEl.scrollTop = messagesEl.scrollHeight;
              } else if (evt.type === 'done' || evt.type === 'error') {
                isLoading = false;
                sendBtn.disabled = false;
              }
            } catch(e) {}
          });
          read();
        });
      }
      read();
    }).catch(function(err) {
      typingDiv.textContent = 'Something went wrong. Please try again.';
      typingDiv.classList.remove('cb-typing');
      isLoading = false;
      sendBtn.disabled = false;
    });
  }

  bubble.addEventListener('click', togglePanel);
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
})();`;

export async function GET() {
  return new Response(WIDGET_JS, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
