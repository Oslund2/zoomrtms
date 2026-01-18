import { X, CheckCircle, AlertTriangle, Target, Lightbulb, TrendingUp, Users, Clock, Zap } from 'lucide-react';
import type { InsightEvent } from '../types/database';
import { formatDistanceToNow } from 'date-fns';

interface InsightDetailPanelProps {
  insight: InsightEvent;
  onClose: () => void;
}

export function InsightDetailPanel({ insight, onClose }: InsightDetailPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alignment': return CheckCircle;
      case 'misalignment': return AlertTriangle;
      case 'gap': return Target;
      case 'highlight': return Lightbulb;
      default: return TrendingUp;
    }
  };

  const getInsightColors = (type: string, severity: string) => {
    if (type === 'misalignment' || severity === 'alert') {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        icon: 'bg-amber-500/20',
      };
    }
    if (type === 'alignment') {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: 'bg-emerald-500/20',
      };
    }
    if (type === 'gap') {
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: 'bg-blue-500/20',
      };
    }
    return {
      bg: 'bg-slate-800/50',
      border: 'border-slate-600/30',
      text: 'text-slate-400',
      icon: 'bg-slate-700/50',
    };
  };

  const Icon = getInsightIcon(insight.insight_type);
  const colors = getInsightColors(insight.insight_type, insight.severity);
  const severityLabel = {
    info: 'Information',
    warning: 'Warning',
    alert: 'Alert',
  }[insight.severity];

  const typeLabel = {
    alignment: 'Strategic Alignment',
    misalignment: 'Misalignment',
    gap: 'Gap Identified',
    highlight: 'Highlight',
    action: 'Action Required',
  }[insight.insight_type];

  return (
    <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className={`px-4 sm:px-6 py-4 sm:py-5 border-b ${colors.border} ${colors.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl ${colors.icon} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-bold text-white truncate">{typeLabel}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text} border ${colors.border}`}>
                {severityLabel}
              </span>
              <span className="text-xs text-slate-400">
                <Clock className="w-3 h-3 inline mr-1" />
                {formatDistanceToNow(new Date(insight.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="ml-2 w-8 h-8 sm:w-9 sm:h-9 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3">
            {insight.title}
          </h3>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {insight.description}
          </p>
        </div>

        {insight.involved_rooms && insight.involved_rooms.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              <h4 className="text-sm sm:text-base font-semibold text-white">Involved Rooms</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {insight.involved_rooms.map((room) => (
                <div
                  key={room}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                >
                  <span className="text-xs sm:text-sm font-medium text-emerald-300">
                    {room === 0 ? 'Main Room' : `Breakout Room ${room}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {insight.related_topics && insight.related_topics.length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <h4 className="text-sm sm:text-base font-semibold text-white">Related Topics</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {insight.related_topics.map((topic, index) => (
                <div
                  key={index}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                >
                  <span className="text-xs sm:text-sm font-medium text-blue-300">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {insight.metadata && Object.keys(insight.metadata).length > 0 && (
          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
            <h4 className="text-sm sm:text-base font-semibold text-white mb-3">Additional Details</h4>
            <div className="space-y-2">
              {Object.entries(insight.metadata).map(([key, value]) => (
                <div key={key} className="flex items-start gap-2 text-xs sm:text-sm">
                  <span className="text-slate-400 min-w-[100px] capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-slate-300 flex-1">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          Press ESC or click outside to close
        </p>
      </div>
    </div>
  );
}
