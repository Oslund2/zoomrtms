import { useState, useEffect } from 'react';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  ExternalLink,
  Rocket,
  Key,
  Webhook,
  Code,
  CheckCircle2,
  AlertCircle,
  Zap,
  Download,
  Terminal,
  RefreshCw,
  Loader2
} from 'lucide-react';
import {
  generateNodeJSRTMSClient,
  generateEnvTemplate,
  generateNpmInstallCommand,
  generateCurlTestCommand,
  generatePowerShellTestCommand,
  generateCurlChatCommand,
  generateCurlParticipantCommand,
  generateWebhookTestPayload
} from '../lib/codeGenerator';
import { supabase } from '../lib/supabase';

interface SetupState {
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  scopesConfirmed: boolean;
  redirectUrlConfigured: boolean;
}

const STEPS = [
  { id: 1, title: 'Create Zoom App', icon: Rocket },
  { id: 2, title: 'OAuth Credentials', icon: Key },
  { id: 3, title: 'Webhook Setup', icon: Webhook },
  { id: 4, title: 'RTMS Scopes', icon: CheckCircle2 },
  { id: 5, title: 'Client Code', icon: Code },
  { id: 6, title: 'Test & Verify', icon: Zap },
];

export default function SetupTab() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupState, setSetupState] = useState<SetupState>(() => {
    const saved = localStorage.getItem('rtms_setup_state');
    return saved ? JSON.parse(saved) : {
      clientId: '',
      clientSecret: '',
      webhookSecret: '',
      scopesConfirmed: false,
      redirectUrlConfigured: false,
    };
  });
  const [copied, setCopied] = useState<string | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrl = `${supabaseUrl}/functions/v1/zoom-webhook`;
  const dataUrl = `${supabaseUrl}/functions/v1/rtms-data`;

  useEffect(() => {
    localStorage.setItem('rtms_setup_state', JSON.stringify(setupState));
  }, [setupState]);

  const updateField = (field: keyof SetupState, value: any) => {
    setSetupState((prev) => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return setupState.redirectUrlConfigured;
      case 2:
        return !!setupState.clientId && !!setupState.clientSecret;
      case 3:
        return !!setupState.webhookSecret;
      case 4:
        return setupState.scopesConfirmed;
      case 5:
        return true;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const canProceed = isStepComplete(currentStep);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          RTMS Setup Wizard
        </h2>
        <p className="text-slate-600">
          Configure your Zoom RTMS integration in 6 simple steps
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex overflow-x-auto scrollbar-thin">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(step.id)}
              className={`flex-1 min-w-[120px] px-4 py-4 border-b-2 transition-colors ${
                currentStep === step.id
                  ? 'border-blue-500 bg-blue-50'
                  : isStepComplete(step.id)
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id
                      ? 'bg-blue-500 text-white'
                      : isStepComplete(step.id)
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isStepComplete(step.id) && currentStep !== step.id ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium ${
                    currentStep === step.id
                      ? 'text-blue-700'
                      : isStepComplete(step.id)
                      ? 'text-emerald-700'
                      : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        {currentStep === 1 && (
          <Step1CreateApp
            redirectUrlConfigured={setupState.redirectUrlConfigured}
            onRedirectUrlConfigured={(val) => updateField('redirectUrlConfigured', val)}
            supabaseUrl={supabaseUrl}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
        {currentStep === 2 && (
          <Step2OAuth
            clientId={setupState.clientId}
            clientSecret={setupState.clientSecret}
            onClientIdChange={(val) => updateField('clientId', val)}
            onClientSecretChange={(val) => updateField('clientSecret', val)}
          />
        )}
        {currentStep === 3 && (
          <Step3Webhook
            webhookUrl={webhookUrl}
            webhookSecret={setupState.webhookSecret}
            onWebhookSecretChange={(val) => updateField('webhookSecret', val)}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
        {currentStep === 4 && (
          <Step4Scopes
            scopesConfirmed={setupState.scopesConfirmed}
            onConfirm={(val) => updateField('scopesConfirmed', val)}
          />
        )}
        {currentStep === 5 && (
          <Step5ClientCode
            credentials={{
              clientId: setupState.clientId,
              clientSecret: setupState.clientSecret,
              webhookSecret: setupState.webhookSecret,
              supabaseUrl,
              dataEndpoint: dataUrl,
            }}
            onCopy={copyToClipboard}
            onDownload={downloadFile}
            copied={copied}
          />
        )}
        {currentStep === 6 && (
          <Step6Test
            webhookUrl={webhookUrl}
            dataUrl={dataUrl}
            onCopy={copyToClipboard}
            copied={copied}
          />
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </button>

        {currentStep < 6 ? (
          <button
            onClick={() => setCurrentStep((prev) => Math.min(6, prev + 1))}
            disabled={!canProceed}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
          >
            Restart Wizard
            <RefreshCw className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function Step1CreateApp({
  redirectUrlConfigured,
  onRedirectUrlConfigured,
  supabaseUrl,
  onCopy,
  copied,
}: {
  redirectUrlConfigured: boolean;
  onRedirectUrlConfigured: (val: boolean) => void;
  supabaseUrl: string;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  const redirectUrl = `${supabaseUrl}/auth/v1/callback`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Zoom App</h2>
        <p className="text-slate-600">
          Create an OAuth app in the Zoom Marketplace for RTMS with user authorization
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Important:</strong> OAuth apps allow meeting hosts to authorize your app to access RTMS data from their meetings. This is the correct app type for RTMS integrations where hosts need to give permission.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Step 1.1: Visit Zoom Marketplace</h3>
            <p className="text-sm text-slate-600 mt-1">
              Go to the Zoom App Marketplace to create your app
            </p>
          </div>
          <a
            href="https://marketplace.zoom.us/develop/create"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Open Marketplace
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Step 1.2: Select App Type</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Click "Create" button
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Choose <strong>"OAuth"</strong> app type (NOT Server-to-Server OAuth)
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Give your app a name (e.g., "RTMS Meeting Processor")
            </li>
          </ol>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Step 1.3: Configure Redirect URL</h3>
          <p className="text-sm text-slate-600 mb-3">
            In your Zoom app settings, add this redirect URL under "OAuth" settings:
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={redirectUrl}
              className="flex-1 px-4 py-3 bg-white border border-amber-300 rounded-xl text-slate-700 font-mono text-sm"
            />
            <button
              onClick={() => onCopy(redirectUrl, 'redirect-url')}
              className="px-4 py-3 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
            >
              {copied === 'redirect-url' ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5 text-amber-700" />
              )}
            </button>
          </div>
          <p className="text-xs text-amber-700 mt-2">
            Note: For this RTMS integration, the redirect URL is required for OAuth setup but the actual authorization flow happens when meeting hosts enable RTMS for their meetings.
          </p>
        </div>

        <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
          <input
            type="checkbox"
            checked={redirectUrlConfigured}
            onChange={(e) => onRedirectUrlConfigured(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-emerald-900">
            I confirm that I have created an OAuth app and configured the redirect URL
          </span>
        </label>
      </div>
    </div>
  );
}

function Step2OAuth({
  clientId,
  clientSecret,
  onClientIdChange,
  onClientSecretChange,
}: {
  clientId: string;
  clientSecret: string;
  onClientIdChange: (val: string) => void;
  onClientSecretChange: (val: string) => void;
}) {
  const [showSecret, setShowSecret] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">OAuth Credentials</h2>
        <p className="text-slate-600">
          Copy your Client ID and Client Secret from the App Credentials page
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>Security Note:</strong> Keep these credentials secure. They will be
            stored in your browser's local storage for this setup wizard only.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Client ID
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => onClientIdChange(e.target.value)}
            placeholder="Enter your Client ID"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Client Secret
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <input
              type={showSecret ? 'text' : 'password'}
              value={clientSecret}
              onChange={(e) => onClientSecretChange(e.target.value)}
              placeholder="Enter your Client Secret"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-24"
            />
            <button
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-slate-600 hover:text-slate-900"
            >
              {showSecret ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-2">Where to find these:</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Go to your app in the Zoom Marketplace
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Click on "App Credentials" in the left sidebar
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Copy the Client ID and Client Secret values
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function Step3Webhook({
  webhookUrl,
  webhookSecret,
  onWebhookSecretChange,
  onCopy,
  copied,
}: {
  webhookUrl: string;
  webhookSecret: string;
  onWebhookSecretChange: (val: string) => void;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Webhook Configuration</h2>
        <p className="text-slate-600">
          Configure your webhook endpoint to receive RTMS events
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Webhook Endpoint URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono"
            />
            <button
              onClick={() => onCopy(webhookUrl, 'webhook-url')}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {copied === 'webhook-url' ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <Copy className="w-5 h-5 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">
            Required Webhook Events
          </h3>
          <div className="space-y-2">
            {[
              { event: 'meeting.rtms_started', required: true },
              { event: 'meeting.rtms_stopped', required: true },
              { event: 'meeting.participant_joined', required: false },
              { event: 'meeting.participant_left', required: false },
            ].map((item) => (
              <div
                key={item.event}
                className="flex items-center justify-between p-3 bg-white rounded-lg"
              >
                <code className="text-sm text-slate-700">{item.event}</code>
                {item.required && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Required
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Webhook Secret Token
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={webhookSecret}
            onChange={(e) => onWebhookSecretChange(e.target.value)}
            placeholder="Enter the Secret Token from your webhook configuration"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            This is generated by Zoom when you add the webhook endpoint
          </p>
        </div>
      </div>
    </div>
  );
}

function Step4Scopes({
  scopesConfirmed,
  onConfirm,
}: {
  scopesConfirmed: boolean;
  onConfirm: (val: boolean) => void;
}) {
  const requiredScopes = [
    { scope: 'meeting:read:admin', description: 'Read meeting information' },
    { scope: 'meeting:write:admin', description: 'Manage meetings' },
    { scope: 'user:read:admin', description: 'Read user information' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">OAuth Scopes & RTMS Access</h2>
        <p className="text-slate-600">
          Configure OAuth scopes and enable RTMS features for your app
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>OAuth Authorization:</strong> With OAuth apps, meeting hosts will authorize your app to access RTMS data from their meetings. The scopes you configure here determine what permissions users grant when they authorize your app.
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <strong>RTMS Access:</strong> Your Zoom account must have RTMS enabled. Contact your Zoom representative or Zoom support if you don't see RTMS options in your app settings.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Required Scopes</h3>
          <div className="space-y-2">
            {requiredScopes.map((item) => (
              <div
                key={item.scope}
                className="flex items-start gap-3 p-3 bg-white rounded-lg"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <code className="text-sm font-medium text-slate-900">
                    {item.scope}
                  </code>
                  <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-2">How to configure scopes and RTMS:</h3>
          <ol className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              Go to your OAuth app in the Zoom Marketplace
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              Click on "Scopes" in the left sidebar
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Search for and add each required scope listed above
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              Look for "Features" or "Real-Time Media Streaming" section in your app settings
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                5
              </span>
              Enable RTMS features for your OAuth app (requires account-level RTMS access)
            </li>
          </ol>
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <h3 className="font-semibold text-emerald-900 mb-2">User Authorization Flow</h3>
          <p className="text-sm text-emerald-800">
            Once configured, meeting hosts will authorize your app when they want to enable RTMS for their meetings. They'll see a consent screen showing the scopes you've requested, and once approved, your app will receive webhook events and can connect to their RTMS streams.
          </p>
        </div>

        <label className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl cursor-pointer hover:bg-emerald-100 transition-colors">
          <input
            type="checkbox"
            checked={scopesConfirmed}
            onChange={(e) => onConfirm(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm font-medium text-emerald-900">
            I confirm that I have added all required scopes to my Zoom app
          </span>
        </label>
      </div>
    </div>
  );
}

function Step5ClientCode({
  credentials,
  onCopy,
  onDownload,
  copied,
}: {
  credentials: any;
  onCopy: (text: string, key: string) => void;
  onDownload: (content: string, filename: string) => void;
  copied: string | null;
}) {
  const clientCode = generateNodeJSRTMSClient(credentials);
  const envTemplate = generateEnvTemplate(credentials.supabaseUrl);
  const npmCommand = generateNpmInstallCommand();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">RTMS Client Code</h2>
        <p className="text-slate-600">
          Copy or download the ready-to-use Node.js RTMS client code
        </p>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-800">
            <strong>Multi-Room Support:</strong> This client automatically handles 1 main
            conference room + 8 breakout rooms simultaneously.
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">
              Step 1: Install Dependencies
            </label>
            <button
              onClick={() => onCopy(npmCommand, 'npm')}
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              {copied === 'npm' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-sm font-mono">
            {npmCommand}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">
              Step 2: Client Code (rtms-client.js)
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onCopy(clientCode, 'client')}
                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                {copied === 'client' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                Copy
              </button>
              <button
                onClick={() => onDownload(clientCode, 'rtms-client.js')}
                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-sm font-mono max-h-96 scrollbar-thin">
            {clientCode}
          </pre>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">
              Step 3: Environment Variables (.env)
            </label>
            <button
              onClick={() => onCopy(envTemplate, 'env')}
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              {copied === 'env' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy
            </button>
          </div>
          <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-sm font-mono">
            {envTemplate}
          </pre>
        </div>
      </div>
    </div>
  );
}

function Step6Test({
  webhookUrl,
  dataUrl,
  onCopy,
  copied,
}: {
  webhookUrl: string;
  dataUrl: string;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  const [testMeetingId, setTestMeetingId] = useState<string | null>(null);
  const [testMeetingUuid, setTestMeetingUuid] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [shellType, setShellType] = useState<'curl' | 'powershell'>('curl');
  const [commandType, setCommandType] = useState<'transcript' | 'chat' | 'participant'>('transcript');

  const createTestMeeting = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const meetingUuid = crypto.randomUUID();
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          meeting_uuid: meetingUuid,
          topic: `Test Meeting - Setup Wizard ${new Date().toLocaleString()}`,
          host_name: 'Setup Wizard',
          status: 'active',
          room_type: 'main',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setTestMeetingId(data.id);
      setTestMeetingUuid(data.meeting_uuid);

      localStorage.setItem('rtms_test_meeting', JSON.stringify({
        id: data.id,
        meeting_uuid: data.meeting_uuid,
        created_at: new Date().toISOString()
      }));
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create test meeting');
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('rtms_test_meeting');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const createdAt = new Date(parsed.created_at);
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

        if (createdAt > hourAgo) {
          setTestMeetingId(parsed.id);
          setTestMeetingUuid(parsed.meeting_uuid);
          return;
        }
      } catch (e) {}
    }
    createTestMeeting();
  }, []);

  const getCommand = () => {
    if (shellType === 'curl') {
      switch (commandType) {
        case 'transcript':
          return generateCurlTestCommand(dataUrl, testMeetingUuid || undefined);
        case 'chat':
          return generateCurlChatCommand(dataUrl, testMeetingUuid || undefined);
        case 'participant':
          return generateCurlParticipantCommand(dataUrl, testMeetingUuid || undefined);
      }
    } else {
      return generatePowerShellTestCommand(dataUrl, testMeetingUuid || undefined);
    }
  };

  const command = getCommand();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Test & Verify</h2>
        <p className="text-slate-600">
          Test your configuration to ensure everything is working correctly
        </p>
      </div>

      <div className="grid gap-4">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Setup Complete!</h3>
          </div>
          <p className="text-sm text-emerald-700">
            Your RTMS integration is configured and ready to receive meeting data.
          </p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Test Meeting Created</h3>
                <p className="text-sm text-blue-700">
                  {testMeetingUuid ? 'Ready for testing' : isCreating ? 'Creating...' : 'No test meeting'}
                </p>
              </div>
            </div>
            <button
              onClick={createTestMeeting}
              disabled={isCreating}
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {isCreating ? 'Creating...' : 'New Test Meeting'}
            </button>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-3">
              <p className="text-sm text-red-700">{createError}</p>
            </div>
          )}

          {testMeetingUuid && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-blue-700 font-medium">Meeting UUID:</span>
              <code className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-mono text-blue-900 truncate">
                {testMeetingUuid}
              </code>
              <button
                onClick={() => onCopy(testMeetingUuid, 'meeting-uuid')}
                className="flex-shrink-0 p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
              >
                {copied === 'meeting-uuid' ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-blue-600" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Test Data Ingestion</h3>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
              <button
                onClick={() => setShellType('curl')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  shellType === 'curl'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                CURL (Bash)
              </button>
              <button
                onClick={() => setShellType('powershell')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  shellType === 'powershell'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PowerShell
              </button>
            </div>

            {shellType === 'curl' && (
              <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setCommandType('transcript')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    commandType === 'transcript'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Transcript
                </button>
                <button
                  onClick={() => setCommandType('chat')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    commandType === 'chat'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chat
                </button>
                <button
                  onClick={() => setCommandType('participant')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    commandType === 'participant'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Participant
                </button>
              </div>
            )}
          </div>

          <p className="text-sm text-slate-600 mb-3">
            {shellType === 'curl'
              ? `Test ${commandType} data ingestion with this command:`
              : 'Test transcript data ingestion with PowerShell:'}
          </p>

          <div className="flex items-start gap-2 mb-2">
            <pre className="flex-1 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono whitespace-pre-wrap">
              {command}
            </pre>
            <button
              onClick={() => onCopy(command, `${shellType}-${commandType}`)}
              className="flex-shrink-0 p-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              {copied === `${shellType}-${commandType}` ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>

          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Expected Response:</strong> {"{ \"success\": true, \"message\": \"Data received\" }"}
            </p>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Run the test commands above to verify data flows to the dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Start your RTMS client with: <code className="bg-slate-200 px-1 rounded">node rtms-client.js</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Start a Zoom meeting with RTMS enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Watch the dashboard for real-time meeting data</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
