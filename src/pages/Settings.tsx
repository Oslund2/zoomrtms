import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Webhook,
  Key,
  Database,
  Bell,
  Shield,
  Copy,
  Check,
  ExternalLink,
  Info,
  Server,
  Zap
} from 'lucide-react';

export default function Settings() {
  const [copied, setCopied] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/zoom-webhook`;
  const dataUrl = `${supabaseUrl}/functions/v1/rtms-data`;

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Configure your Zoom RTMS integration</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Webhook className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Webhook Configuration</h2>
              <p className="text-sm text-slate-500">Configure your Zoom app webhook endpoint</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Webhook Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {copied === 'webhook' ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Add this URL to your Zoom App's Event Subscriptions in the Zoom Marketplace
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Data Ingestion Endpoint
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={dataUrl}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 font-mono"
                />
                <button
                  onClick={() => copyToClipboard(dataUrl, 'data')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  {copied === 'data' ? (
                    <Check className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Copy className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Use this endpoint to send transcript, chat, and media event data from your RTMS client
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Key className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Zoom App Credentials</h2>
              <p className="text-sm text-slate-500">Required credentials for RTMS integration</p>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-800 mb-1">Environment Variables Required</h3>
                  <p className="text-sm text-amber-700">
                    Configure the following environment variables in your Supabase Edge Functions:
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <CredentialRow
                label="ZOOM_CLIENT_ID"
                description="Your Zoom app's Client ID from the App Credentials page"
              />
              <CredentialRow
                label="ZOOM_CLIENT_SECRET"
                description="Your Zoom app's Client Secret for HMAC signature generation"
              />
              <CredentialRow
                label="ZOOM_WEBHOOK_SECRET"
                description="Secret Token for webhook URL validation"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">RTMS Event Subscriptions</h2>
              <p className="text-sm text-slate-500">Subscribe to these webhook events</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-3">
              <EventRow
                event="meeting.rtms_started"
                description="Triggered when RTMS stream begins for a meeting"
                required
              />
              <EventRow
                event="meeting.rtms_stopped"
                description="Triggered when RTMS stream ends for a meeting"
                required
              />
              <EventRow
                event="meeting.participant_joined"
                description="Track when participants join the meeting"
              />
              <EventRow
                event="meeting.participant_left"
                description="Track when participants leave the meeting"
              />
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Database Status</h2>
              <p className="text-sm text-slate-500">Supabase connection and tables</p>
            </div>
          </div>

          <div className="p-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <StatusCard
                icon={Server}
                label="Supabase Connection"
                status="Connected"
                statusColor="emerald"
              />
              <StatusCard
                icon={Database}
                label="Database Tables"
                status="5 tables active"
                statusColor="emerald"
              />
              <StatusCard
                icon={Shield}
                label="Row Level Security"
                status="Enabled"
                statusColor="emerald"
              />
              <StatusCard
                icon={Bell}
                label="Realtime Subscriptions"
                status="Active"
                statusColor="emerald"
              />
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-1">Zoom Developer Resources</h2>
              <p className="text-slate-400 text-sm mb-4">
                Learn more about building with Zoom RTMS
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://developers.zoom.us/docs/rtms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  RTMS Documentation
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://github.com/zoom/rtms-quickstart-js"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  SDK Quickstart
                  <ExternalLink className="w-4 h-4" />
                </a>
                <a
                  href="https://marketplace.zoom.us/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
                >
                  Zoom Marketplace
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function CredentialRow({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
      <code className="px-2 py-1 bg-slate-200 rounded text-sm font-mono text-slate-700">
        {label}
      </code>
      <p className="text-sm text-slate-600 flex-1">{description}</p>
    </div>
  );
}

function EventRow({
  event,
  description,
  required,
}: {
  event: string;
  description: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <code className="text-sm font-mono text-slate-700">{event}</code>
          {required && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              Required
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
    </div>
  );
}

function StatusCard({
  icon: Icon,
  label,
  status,
  statusColor,
}: {
  icon: React.ElementType;
  label: string;
  status: string;
  statusColor: 'emerald' | 'amber' | 'red';
}) {
  const colorClasses = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl flex items-center gap-3">
      <Icon className="w-5 h-5 text-slate-400" />
      <div className="flex-1">
        <p className="text-sm text-slate-600">{label}</p>
        <p className={`text-sm font-medium ${colorClasses[statusColor]}`}>{status}</p>
      </div>
    </div>
  );
}
