import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Settings as SettingsIcon, Rocket, ArrowLeft, Terminal, Tag } from 'lucide-react';
import SettingsTab from '../components/SettingsTab';
import SetupTab from '../components/SetupTab';
import ApiTesterTab from '../components/ApiTesterTab';
import BulkRenameUtility from '../components/BulkRenameUtility';

export default function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = tabParam === 'setup' ? 'setup' : tabParam === 'tester' ? 'tester' : tabParam === 'naming' ? 'naming' : 'settings';
  const [activeTab, setActiveTab] = useState<'settings' | 'setup' | 'tester' | 'naming'>(initialTab);

  const handleTabChange = (tab: 'settings' | 'setup' | 'tester' | 'naming') => {
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
                onClick={() => handleTabChange('naming')}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === 'naming'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Tag className="w-5 h-5" />
                <span>Naming</span>
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
            {activeTab === 'settings' ? (
              <SettingsTab />
            ) : activeTab === 'naming' ? (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Tag className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-900">Meeting Name Manager</h2>
                      <p className="text-sm text-slate-500">Fix meetings with non-compliant Zoom naming conventions</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <BulkRenameUtility />
                  </div>
                </div>
              </div>
            ) : activeTab === 'setup' ? (
              <SetupTab />
            ) : (
              <ApiTesterTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
