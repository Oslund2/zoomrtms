import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Rocket, ArrowLeft, Terminal } from 'lucide-react';
import SettingsTab from '../components/SettingsTab';
import SetupTab from '../components/SetupTab';
import ApiTesterTab from '../components/ApiTesterTab';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'setup' ? 'setup' : tabParam === 'tester' ? 'tester' : 'settings';
  const [activeTab, setActiveTab] = useState<'settings' | 'setup' | 'tester'>(initialTab);

  const handleTabChange = (tab: 'settings' | 'setup' | 'tester') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Developer Settings</h1>
            </div>
          </div>
          <p className="text-slate-500 ml-14">Configure your Zoom RTMS integration and manage settings</p>
        </div>

        <div className="max-w-6xl">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => handleTabChange('settings')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === 'settings'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <SettingsIcon className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => handleTabChange('setup')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === 'setup'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Rocket className="w-5 h-5" />
                <span>Setup</span>
              </button>
              <button
                onClick={() => handleTabChange('tester')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === 'tester'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Terminal className="w-5 h-5" />
                <span>RTMS Tester</span>
              </button>
            </div>
          </div>

          <div className="transition-opacity duration-200">
            {activeTab === 'settings' ? <SettingsTab /> : activeTab === 'setup' ? <SetupTab /> : <ApiTesterTab />}
          </div>
        </div>
      </div>
    </div>
  );
}
