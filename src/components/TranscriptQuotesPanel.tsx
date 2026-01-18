import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Transcript } from '../types/database';
import { useAmbientSelection } from '../contexts/AmbientSelectionContext';

interface TranscriptWithRoom extends Transcript {
  room_number?: number;
  room_type?: string;
}

interface TranscriptQuotesPanelProps {
  transcripts: TranscriptWithRoom[];
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

function isRelevantToTopic(content: string, topicLabel: string): boolean {
  const lowerContent = content.toLowerCase();
  const lowerTopic = topicLabel.toLowerCase();
  const topicWords = lowerTopic.split(' ');
  return topicWords.some(word => lowerContent.includes(word));
}

export function TranscriptQuotesPanel({ transcripts }: TranscriptQuotesPanelProps) {
  const { selectedTopic, selectedRoom, setSelectedTranscript } = useAmbientSelection();
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();

  const filteredTranscripts = transcripts
    .filter((transcript) => {
      if (selectedRoom !== null && transcript.room_number !== selectedRoom) {
        return false;
      }
      if (selectedTopic && !isRelevantToTopic(transcript.content, selectedTopic.label)) {
        return false;
      }
      return true;
    })
    .slice(0, 12);

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
  };

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

  const scrollDuration = Math.max(20, filteredTranscripts.length * 3);

  const renderQuoteCard = (transcript: TranscriptWithRoom, keyPrefix: string = '') => {
    const category = detectCategory(transcript.content);
    const color = CATEGORY_COLORS[category];
    const isMatchingTopic = selectedTopic && isRelevantToTopic(transcript.content, selectedTopic.label);
    const isMatchingRoom = selectedRoom === transcript.room_number;

    return (
      <div
        key={`${keyPrefix}${transcript.id}`}
        onClick={() => setSelectedTranscript(transcript)}
        className={`p-3 rounded-lg border bg-slate-800/30 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] hover:bg-slate-800/50 ${
          isMatchingTopic || isMatchingRoom
            ? 'border-blue-400/50 ring-1 ring-blue-400/30'
            : 'border-slate-700/50 hover:border-slate-600'
        }`}
      >
        <div className="flex items-start gap-2">
          <div
            className="w-1 h-full rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-xs font-semibold text-white truncate">
                  {transcript.speaker_name || 'Unknown Speaker'}
                </span>
                {transcript.room_number !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 text-[10px] rounded flex-shrink-0 ${
                      isMatchingRoom
                        ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}
                  >
                    {transcript.room_number === 0 ? 'Main' : `R${transcript.room_number}`}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {formatDistanceToNow(new Date(transcript.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {transcript.content}
            </p>
            {isMatchingTopic && (
              <div className="mt-1.5 flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-blue-500/20 border border-blue-400/40 text-[10px] text-blue-300 rounded">
                  Matches: {selectedTopic.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Live Quotes</h2>
        </div>
        <span className="px-2 py-1 bg-slate-700/50 border border-slate-600/30 rounded-lg text-xs text-slate-300">
          {filteredTranscripts.length}/{transcripts.length}
        </span>
      </div>

      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleInteraction}
        onWheel={handleInteraction}
      >
        {filteredTranscripts.length === 0 && transcripts.length > 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No quotes match filters</p>
              <p className="text-xs text-slate-500">Try a different selection</p>
            </div>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Listening for quotes...</p>
              <p className="text-xs text-slate-500">Transcripts will appear here</p>
            </div>
          </div>
        ) : filteredTranscripts.length <= 4 ? (
          <div className="p-3 space-y-2 overflow-y-auto h-full">
            {filteredTranscripts.map((transcript) => renderQuoteCard(transcript))}
          </div>
        ) : (
          <div
            className={`animate-smooth-scroll p-3 space-y-2 ${isPaused ? 'paused' : ''}`}
            style={{ '--scroll-duration': `${scrollDuration}s` } as React.CSSProperties}
          >
            {filteredTranscripts.map((transcript) => renderQuoteCard(transcript))}
            <div className="h-2" aria-hidden="true" />
            {filteredTranscripts.map((transcript) => renderQuoteCard(transcript, 'dup-'))}
          </div>
        )}
      </div>
    </div>
  );
}
