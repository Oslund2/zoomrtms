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
  Download
} from 'lucide-react';
import {
  generateNodeJSRTMSClient,
  generateEnvTemplate,
  generateNpmInstallCommand,
  generateCurlTestCommand,
  generateWebhookTestPayload
} from '../lib/codeGenerator';

interface SetupState {
  accountId: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  scopesConfirmed: boolean;
}

const STEPS = [
  { id: 1, title: 'Create Zoom App', icon: Rocket },
  { id: 2, title: 'OAuth Credentials', icon: Key },
  { id: 3, title: 'Webhook Setup', icon: Webhook },
  { id: 4, title: 'RTMS Scopes', icon: CheckCircle2 },
  { id: 5, title: 'Client Code', icon: Code },
  { id: 6, title: 'Test & Verify', icon: Zap },
];

export default function Setup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [setupState, setSetupState] = useState<SetupState>(() => {
    const saved = localStorage.getItem('rtms_setup_state');
    return saved ? JSON.parse(saved) : {
      accountId: '',
      clientId: '',
      clientSecret: '',
      webhookSecret: '',
      scopesConfirmed: false,
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
        return !!setupState.accountId;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            RTMS Setup Wizard
          </h1>
          <p className="text-slate-600">
            Configure your Zoom RTMS integration in 6 simple steps
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden mb-8">
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

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          {currentStep === 1 && (
            <Step1CreateApp
              accountId={setupState.accountId}
              onAccountIdChange={(val) => updateField('accountId', val)}
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
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
            >
              Go to Dashboard
              <Rocket className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1CreateApp({
  accountId,
  onAccountIdChange,
  onCopy,
  copied,
}: {
  accountId: string;
  onAccountIdChange: (val: string) => void;
  onCopy: (text: string, key: string) => void;
  copied: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Your Zoom App</h2>
        <p className="text-slate-600">
          First, create a Server-to-Server OAuth app in the Zoom Marketplace
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Important:</strong> This app type allows secure, automated access to
            Zoom APIs without requiring user interaction.
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
              Choose "Server-to-Server OAuth" app type
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Give your app a name (e.g., "RTMS Meeting Processor")
            </li>
          </ol>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Account ID
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={accountId}
            onChange={(e) => onAccountIdChange(e.target.value)}
            placeholder="Enter your Zoom Account ID"
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-slate-500 mt-2">
            Find this in your app's "App Credentials" page in the Zoom Marketplace
          </p>
        </div>
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">RTMS Scope Activation</h2>
        <p className="text-slate-600">
          Enable the required scopes for RTMS functionality
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>RTMS Access:</strong> To use Realtime Media Streams, your Zoom account
            must have RTMS enabled. Contact Zoom if you don't see RTMS options.
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
          <h3 className="font-semibold text-slate-900 mb-2">How to add scopes:</h3>
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
              Click on "Scopes" in the left sidebar
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              Search for and add each required scope
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              Enable RTMS features under "Feature" tab if available
            </li>
          </ol>
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
  const curlCommand = generateCurlTestCommand(dataUrl);
  const webhookPayload = generateWebhookTestPayload();

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

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Test Data Ingestion</h3>
          <p className="text-sm text-slate-600 mb-3">
            Run this curl command to test your data ingestion endpoint:
          </p>
          <div className="flex items-start gap-2 mb-2">
            <pre className="flex-1 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto text-xs font-mono">
              {curlCommand}
            </pre>
            <button
              onClick={() => onCopy(curlCommand, 'curl')}
              className="flex-shrink-0 p-2 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
            >
              {copied === 'curl' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl">
          <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
          <ol className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Start your RTMS client with: <code className="bg-slate-200 px-1 rounded">node rtms-client.js</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>Start a Zoom meeting with RTMS enabled</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Watch the dashboard for real-time meeting data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                4
              </span>
              <span>Create breakout rooms and see them appear as separate streams</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
