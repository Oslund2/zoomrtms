import { X, MessageSquare, Clock, User, MapPin, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import type { Transcript } from '../types/database';

interface TranscriptWithRoom extends Transcript {
  room_number?: number;
  room_type?: string;
}

interface TranscriptDetailPanelProps {
  transcript: TranscriptWithRoom;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: '#3b82f6',
  Operations: '#10b981',
  Technology: '#8b5cf6',
  People: '#f59e0b',
  Finance: '#ef4444',
  General: '#6b7280',
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Strategy: ['strategy', 'strategic', 'vision', 'goal', 'objective', 'plan', 'direction', 'competitive', 'market', 'business model'],
  Operations: ['process', 'workflow', 'automation', 'efficiency', 'optimize', 'operational', 'pipeline', 'bottleneck', 'scalability'],
  Technology: ['cloud', 'api', 'microservices', 'infrastructure', 'architecture', 'technical', 'platform', 'deployment', 'containerization'],
  People: ['team', 'change management', 'training', 'culture', 'employee', 'morale', 'communication', 'workforce', 'upskill'],
  Finance: ['budget', 'cost', 'roi', 'investment', 'financial', 'expenditure', 'opex', 'capex', 'breakeven'],
};

function detectCategory(content: string): string {
  const lowerContent = content.toLowerCase();
  let bestMatch = 'General';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(keyword => lowerContent.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMatch = category;
    }
  }

  return bestMatch;
}

export function TranscriptDetailPanel({ transcript, onClose }: TranscriptDetailPanelProps) {
  const { isDemoMode, demoData } = useDemoMode();
  const [contextTranscripts, setContextTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [meetingName, setMeetingName] = useState<string>('');

  const category = detectCategory(transcript.content);
  const color = CATEGORY_COLORS[category];

  const fetchContext = useCallback(async () => {
    setLoading(true);

    if (isDemoMode) {
      const allTranscripts = demoData.transcripts;
      const currentIndex = allTranscripts.findIndex(t => t.id === transcript.id);

      if (currentIndex !== -1) {
        const start = Math.max(0, currentIndex - 3);
        const end = Math.min(allTranscripts.length, currentIndex + 4);
        setContextTranscripts(allTranscripts.slice(start, end));
      }

      const meeting = demoData.meetings.find(m => m.id === transcript.meeting_id);
      setMeetingName(meeting?.meeting_name || 'Unknown Meeting');
      setLoading(false);
      return;
    }

    const { data: meetingData } = await supabase
      .from('meetings')
      .select('meeting_name')
      .eq('id', transcript.meeting_id)
      .maybeSingle();

    setMeetingName(meetingData?.meeting_name || 'Unknown Meeting');

    const { data } = await supabase
      .from('transcripts')
      .select('*')
      .eq('meeting_id', transcript.meeting_id)
      .order('sequence', { ascending: true });

    if (data) {
      const currentIndex = data.findIndex(t => t.id === transcript.id);
      if (currentIndex !== -1) {
        const start = Math.max(0, currentIndex - 3);
        const end = Math.min(data.length, currentIndex + 4);
        setContextTranscripts(data.slice(start, end));
      } else {
        setContextTranscripts([transcript]);
      }
    }

    setLoading(false);
  }, [transcript, isDemoMode, demoData]);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full sm:w-[500px] lg:w-[600px] bg-slate-900 border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div
          className="px-4 sm:px-6 py-4 sm:py-5 border-b border-cyan-500/30 bg-cyan-500/10 flex items-center justify-between"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center flex-shrink-0"
            >
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-xl font-bold text-white truncate">Transcript Quote</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {category}
                </span>
                <span className="text-xs text-slate-400">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
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
          <div className="bg-slate-800/50 rounded-xl p-4 border-l-4" style={{ borderLeftColor: color }}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {transcript.speaker_name || 'Unknown Speaker'}
                </h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {transcript.room_number !== undefined && (
                    <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-xs text-emerald-300 rounded">
                      {transcript.room_number === 0 ? 'Main Room' : `Breakout Room ${transcript.room_number}`}
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    {new Date(transcript.created_at).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
              {transcript.content}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <h4 className="text-sm sm:text-base font-semibold text-white">Meeting Info</h4>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex items-start gap-2">
                <span className="text-slate-400 min-w-[80px]">Meeting:</span>
                <span className="text-slate-300 flex-1">{meetingName}</span>
              </div>
              {transcript.room_type && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 min-w-[80px]">Room Type:</span>
                  <span className="text-slate-300 flex-1 capitalize">{transcript.room_type}</span>
                </div>
              )}
            </div>
          </div>

          {!loading && contextTranscripts.length > 1 && (
            <div className="bg-slate-800/50 rounded-xl p-3 sm:p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <h4 className="text-sm sm:text-base font-semibold text-white">Conversation Context</h4>
              </div>
              <div className="space-y-3">
                {contextTranscripts.map((ctx) => {
                  const isCurrentTranscript = ctx.id === transcript.id;
                  return (
                    <div
                      key={ctx.id}
                      className={`p-3 rounded-lg border transition-all ${
                        isCurrentTranscript
                          ? 'bg-cyan-500/10 border-cyan-500/40 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-white">
                          {ctx.speaker_name || 'Unknown Speaker'}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(ctx.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ctx.content}
                      </p>
                      {isCurrentTranscript && (
                        <div className="mt-2">
                          <span className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-300 rounded">
                            Selected Quote
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-700 bg-slate-900/50">
          <p className="text-xs text-slate-500 text-center">
            Press ESC or click outside to close
          </p>
        </div>
      </div>
    </>
  );
}
