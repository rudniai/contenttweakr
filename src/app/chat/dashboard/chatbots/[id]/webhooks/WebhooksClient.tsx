'use client';

import { useState } from 'react';
import type { Webhook, WebhookDelivery } from '@/lib/chatbase/db';

const ALL_EVENTS = ['new_message', 'new_conversation', 'escalation'] as const;

function DeliveryHistory({ chatbotId, webhookId }: { chatbotId: string; webhookId: string }) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function load() {
    if (deliveries !== null) {
      setExpanded((e) => !e);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/chat/chatbots/${chatbotId}/webhooks/${webhookId}/deliveries`
      );
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data);
        setExpanded(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3">
      <button
        onClick={load}
        disabled={loading}
        className="text-xs text-indigo-600 hover:underline disabled:opacity-50"
      >
        {loading ? 'Loading...' : expanded ? 'Hide delivery history' : 'View delivery history'}
      </button>

      {expanded && deliveries !== null && (
        <div className="mt-2">
          {deliveries.length === 0 ? (
            <p className="text-xs text-gray-400">No deliveries yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {deliveries.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 text-xs text-gray-600 bg-gray-50 rounded px-3 py-2"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                      d.delivered_at ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-mono text-gray-500">{d.event}</span>
                  {d.status_code && (
                    <span
                      className={`font-mono ${
                        d.status_code >= 200 && d.status_code < 300
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {d.status_code}
                    </span>
                  )}
                  <span className="text-gray-400 ml-auto">
                    {new Date(d.created_at).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function WebhooksClient({
  chatbotId,
  initialWebhooks,
}: {
  chatbotId: string;
  initialWebhooks: Webhook[];
}) {
  const [webhooks, setWebhooks] = useState<Webhook[]>(initialWebhooks);
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([...ALL_EVENTS]);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleEvent(event: string) {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`/api/chat/chatbots/${chatbotId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl, events: selectedEvents }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to create webhook');
      }

      const data = await res.json();
      setWebhooks((prev) => [data, ...prev]);
      setUrl('');
      setSelectedEvents([...ALL_EVENTS]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create webhook');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(webhookId: string) {
    if (!confirm('Delete this webhook?')) return;
    setDeleting(webhookId);
    setError(null);

    try {
      const res = await fetch(
        `/api/chat/chatbots/${chatbotId}/webhooks/${webhookId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to delete webhook');
      }
      setWebhooks((prev) => prev.filter((w) => w.id !== webhookId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete webhook');
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggle(webhook: Webhook) {
    setToggling(webhook.id);
    setError(null);

    try {
      const res = await fetch(
        `/api/chat/chatbots/${chatbotId}/webhooks/${webhook.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled: !webhook.enabled }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to update webhook');
      }
      const data = await res.json();
      setWebhooks((prev) => prev.map((w) => (w.id === webhook.id ? data : w)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update webhook');
    } finally {
      setToggling(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Add webhook form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Add Webhook</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Endpoint URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.com/webhook"
              disabled={creating}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Events</p>
            <div className="flex flex-wrap gap-3">
              {ALL_EVENTS.map((event) => (
                <label key={event} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(event)}
                    onChange={() => toggleEvent(event)}
                    disabled={creating}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {event}
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={creating || !url.trim() || selectedEvents.length === 0}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating && (
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Add Webhook
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Webhook list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            Webhooks{' '}
            <span className="text-sm font-normal text-gray-400">({webhooks.length})</span>
          </h3>
        </div>

        {webhooks.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">
            No webhooks configured yet.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {webhooks.map((webhook) => (
              <li key={webhook.id} className="px-6 py-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">{webhook.url}</p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          webhook.enabled
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {webhook.enabled ? 'active' : 'disabled'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {webhook.events.map((event) => (
                        <span
                          key={event}
                          className="text-xs bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded"
                        >
                          {event}
                        </span>
                      ))}
                      <span className="text-xs text-gray-400">
                        {new Date(webhook.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <DeliveryHistory chatbotId={chatbotId} webhookId={webhook.id} />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggle(webhook)}
                      disabled={toggling === webhook.id}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {toggling === webhook.id
                        ? '...'
                        : webhook.enabled
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(webhook.id)}
                      disabled={deleting === webhook.id}
                      className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {deleting === webhook.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
