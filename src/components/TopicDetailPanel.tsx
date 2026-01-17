import { X, MessageSquare, Users, TrendingUp, Target, Zap, BarChart3 } from 'lucide-react';
import type { InsightEvent } from '../types/database';

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: '#3b82f6',
  Operations: '#10b981',
  Technology: '#8b5cf6',
  People: '#f59e0b',
  Finance: '#ef4444',
  General: '#6b7280',
};

interface SelectedTopic {
  id: string;
  label: string;
  category: string | null;
  roomMentions: Record<string, number>;
}

interface TopicDetailPanelProps {
  topic: SelectedTopic;
  insights: InsightEvent[];
  onClose: () => void;
  nodes: { id: string; label: string; size: number }[];
  edges: { source: string; target: string }[];
}

export function TopicDetailPanel({ topic, insights, onClose, nodes, edges }: TopicDetailPanelProps) {
  const categoryColor = CATEGORY_COLORS[topic.category || 'General'] || CATEGORY_COLORS.General;

  const totalMentions = Object.values(topic.roomMentions).reduce((sum, count) => sum + count, 0);
  const roomCount = Object.keys(topic.roomMentions).length;

  const relatedInsights = insights.filter(insight =>
    insight.related_topics.includes(topic.label)
  );

  const connectedTopics = edges
    .filter(edge => edge.source === topic.id || edge.target === topic.id)
    .map(edge => {
      const connectedId = edge.source === topic.id ? edge.target : edge.source;
      return nodes.find(n => n.id === connectedId);
    })
    .filter(Boolean)
    .slice(0, 5);

  const sortedRooms = Object.entries(topic.roomMentions)
    .map(([room, count]) => ({ room: parseInt(room), count }))
    .sort((a, b) => b.count - a.count);

  const maxRoomCount = Math.max(...sortedRooms.map(r => r.count), 1);

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Zap className="w-6 h-6" style={{ color: categoryColor }} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white truncate">{topic.label}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
                >
                  {topic.category || 'General'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Discussion Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">Total Mentions</span>
              </div>
              <span className="text-2xl font-bold text-white">{totalMentions}</span>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Rooms Discussing</span>
              </div>
              <span className="text-2xl font-bold text-white">{roomCount}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Room Breakdown
          </h3>
          <div className="space-y-2">
            {sortedRooms.map(({ room, count }) => (
              <div key={room} className="flex items-center gap-3">
                <span className="w-12 text-sm text-slate-400 flex-shrink-0">
                  {room === 0 ? 'Main' : `Room ${room}`}
                </span>
                <div className="flex-1 h-6 bg-slate-800 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-2"
                    style={{
                      width: `${(count / maxRoomCount) * 100}%`,
                      backgroundColor: categoryColor,
                      minWidth: '2rem'
                    }}
                  >
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {sortedRooms.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No room data available</p>
          )}
        </div>

        {connectedTopics.length > 0 && (
          <div className="p-4 border-b border-slate-700/50">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Connected Topics
            </h3>
            <div className="flex flex-wrap gap-2">
              {connectedTopics.map(connectedTopic => (
                <span
                  key={connectedTopic!.id}
                  className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300"
                >
                  {connectedTopic!.label}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Related Insights ({relatedInsights.length})
          </h3>
          {relatedInsights.length > 0 ? (
            <div className="space-y-3">
              {relatedInsights.slice(0, 6).map(insight => (
                <div
                  key={insight.id}
                  className={`p-3 rounded-xl border ${
                    insight.insight_type === 'misalignment'
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : insight.insight_type === 'alignment'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}
                >
                  <h4 className="text-sm font-semibold text-white mb-1">{insight.title}</h4>
                  <p className="text-xs text-slate-300 line-clamp-2">{insight.description}</p>
                  {insight.involved_rooms && insight.involved_rooms.length > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      {insight.involved_rooms.slice(0, 4).map(room => (
                        <span key={room} className="px-1.5 py-0.5 bg-slate-700/50 rounded text-[10px] text-slate-300">
                          {room === 0 ? 'M' : room}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No insights linked to this topic yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
        <p className="text-xs text-slate-500 text-center">
          Click anywhere outside or press ESC to close
        </p>
      </div>
    </div>
  );
}
