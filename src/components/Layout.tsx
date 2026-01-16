import { Outlet, NavLink, Link } from 'react-router-dom';
import { Video, LayoutDashboard, History, Code, Menu, X, Brain, Monitor, Activity } from 'lucide-react';
import { useState } from 'react';
import { useDemoMode } from '../contexts/DemoModeContext';

export default function Layout() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleDisableDemoMode = () => {
    if (window.confirm('Turn off demo mode? This will switch to live data from your database.')) {
      toggleDemoMode();
    }
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/history', icon: History, label: 'Meeting History' },
    { to: '/settings', icon: Code, label: 'Developer' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-40 transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">RTMS Hub</h1>
              <p className="text-xs text-slate-400">Zoom Meeting Streams</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-4">Ambient Intelligence</p>
            <Link
              to="/admin"
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <Brain className="w-5 h-5" />
              <span className="font-medium">Admin Panel</span>
            </Link>
            <Link
              to={isDemoMode ? "/display?demo=true" : "/display"}
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <Monitor className="w-5 h-5" />
              <span className="font-medium">Display View</span>
            </Link>
            <Link
              to="/monitor"
              className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-all"
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">RTMS Monitor</span>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">System Status</span>
            </div>
            <p className="text-xs text-slate-400">
              Webhook endpoint ready for incoming RTMS events
            </p>
          </div>
        </div>
      </aside>

      <main className="lg:ml-64 min-h-screen">
        {isDemoMode && (
          <div className="sticky top-0 z-40 bg-blue-500/10 border-b border-blue-400/20 backdrop-blur-sm">
            <div className="px-6 py-2 flex items-center justify-between gap-4">
              <div className="flex items-center justify-center gap-2 text-sm flex-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-medium text-blue-700">Demo Mode Active - Displaying Synthetic Data</span>
              </div>
              <button
                onClick={handleDisableDemoMode}
                className="px-3 py-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-500/20 rounded-lg transition-colors"
              >
                Turn Off
              </button>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
