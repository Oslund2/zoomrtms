import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useDemoMode } from '../contexts/DemoModeContext';

export default function DemoModeControls() {
  const { isDemoMode, isPaused, toggleDemoMode, togglePause, resetDemoData } = useDemoMode();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        if (e.ctrlKey || e.metaKey) return;
        toggleDemoMode();
      } else if (e.key === 'p' || e.key === 'P') {
        if (!isDemoMode) return;
        if (e.ctrlKey || e.metaKey) return;
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDemoMode, toggleDemoMode, togglePause]);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className={`group px-4 py-3 rounded-2xl shadow-lg border backdrop-blur-sm transition-all ${
            isDemoMode
              ? 'bg-blue-500/90 border-blue-400/50 text-white hover:bg-blue-600'
              : 'bg-slate-800/90 border-slate-700/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <>
                {isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
              </>
            )}
            <span className="text-sm font-medium">
              {isDemoMode ? 'DEMO' : 'Demo Off'}
            </span>
            <ChevronUp className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isDemoMode ? 'bg-blue-500 animate-pulse' : 'bg-slate-600'}`} />
            <h3 className="text-sm font-semibold text-white">Demo Mode</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={toggleDemoMode}
            className={`w-full px-4 py-2.5 rounded-xl font-medium transition-all ${
              isDemoMode
                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            {isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
          </button>

          {isDemoMode && (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={togglePause}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span className="text-sm font-medium">Resume</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span className="text-sm font-medium">Pause</span>
                    </>
                  )}
                </button>

                <button
                  onClick={resetDemoData}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700"
                  title="Reset Demo Data"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Update Interval</span>
                  <span className="font-medium text-slate-300">10 seconds</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Status</span>
                  <span className={`font-medium ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isPaused ? 'Paused' : 'Running'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <p className="text-xs text-slate-500">
                  Keyboard: Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">D</kbd> to toggle,{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300">P</kbd> to pause
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
