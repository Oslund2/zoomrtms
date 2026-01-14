import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Video,
  Users,
  MessageSquare,
  Mic,
  Clock,
  User,
  Radio,
  Download,
  Copy,
  Check,
  Monitor,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Meeting, Participant, Transcript, ChatMessage, MediaEvent } from '../types/database';
import { format, formatDistanceToNow } from 'date-fns';

type TabType = 'transcripts' | 'chat' | 'participants' | 'events';

export default function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [mediaEvents, setMediaEvents] = useState<MediaEvent[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('transcripts');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchMeetingData();
      const channel = setupRealtimeSubscription();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id]);

  useEffect(() => {
    if (transcriptEndRef.current && activeTab === 'transcripts') {
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcripts, activeTab]);

  async function fetchMeetingData() {
    if (!id) return;
    setLoading(true);

    const [meetingRes, participantsRes, transcriptsRes, chatRes, eventsRes] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', id).maybeSingle(),
      supabase.from('participants').select('*').eq('meeting_id', id).order('joined_at', { ascending: true }),
      supabase.from('transcripts').select('*').eq('meeting_id', id).order('created_at', { ascending: true }),
      supabase.from('chat_messages').select('*').eq('meeting_id', id).order('created_at', { ascending: true }),
      supabase.from('media_events').select('*').eq('meeting_id', id).order('created_at', { ascending: false }).limit(50),
    ]);

    setMeeting(meetingRes.data);
    setParticipants(participantsRes.data || []);
    setTranscripts(transcriptsRes.data || []);
    setChatMessages(chatRes.data || []);
    setMediaEvents(eventsRes.data || []);
    setLoading(false);
  }

  function setupRealtimeSubscription() {
    const channel = supabase
      .channel(`meeting-${id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings', filter: `id=eq.${id}` },
        (payload) => {
          if (payload.new) setMeeting(payload.new as Meeting);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'participants', filter: `meeting_id=eq.${id}` },
        () => fetchMeetingData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'transcripts', filter: `meeting_id=eq.${id}` },
        (payload) => {
          setTranscripts((prev) => [...prev, payload.new as Transcript]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `meeting_id=eq.${id}` },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'media_events', filter: `meeting_id=eq.${id}` },
        (payload) => {
          setMediaEvents((prev) => [payload.new as MediaEvent, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return channel;
  }

  async function copyTranscript() {
    const text = transcripts
      .map((t) => `[${t.speaker_name || 'Unknown'}]: ${t.content}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadTranscript() {
    const text = transcripts
      .map((t) => {
        const time = t.created_at ? format(new Date(t.created_at), 'HH:mm:ss') : '';
        return `[${time}] ${t.speaker_name || 'Unknown'}: ${t.content}`;
      })
      .join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${meeting?.topic || 'meeting'}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-slate-500 mt-4">Loading meeting data...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Meeting Not Found</h2>
          <p className="text-slate-500 mb-4">This meeting may have been deleted or doesn't exist.</p>
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isActive = meeting.status === 'active';
  const activeParticipants = participants.filter((p) => p.is_active);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link
              to="/"
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-900 truncate">
                  {meeting.topic || 'Untitled Meeting'}
                </h1>
                {isActive ? (
                  <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="flex-shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    Ended
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Hosted by {meeting.host_name || 'Unknown'}
                {meeting.started_at && (
                  <> &middot; Started {formatDistanceToNow(new Date(meeting.started_at), { addSuffix: true })}</>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <TabButton
              active={activeTab === 'transcripts'}
              onClick={() => setActiveTab('transcripts')}
              icon={Mic}
              label="Transcripts"
              count={transcripts.length}
            />
            <TabButton
              active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              icon={MessageSquare}
              label="Chat"
              count={chatMessages.length}
            />
            <TabButton
              active={activeTab === 'participants'}
              onClick={() => setActiveTab('participants')}
              icon={Users}
              label="Participants"
              count={activeParticipants.length}
            />
            <TabButton
              active={activeTab === 'events'}
              onClick={() => setActiveTab('events')}
              icon={Activity}
              label="Events"
              count={mediaEvents.length}
            />
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'transcripts' && (
          <TranscriptsTab
            transcripts={transcripts}
            isActive={isActive}
            onCopy={copyTranscript}
            onDownload={downloadTranscript}
            copied={copied}
            transcriptEndRef={transcriptEndRef}
          />
        )}
        {activeTab === 'chat' && <ChatTab messages={chatMessages} isActive={isActive} />}
        {activeTab === 'participants' && <ParticipantsTab participants={participants} />}
        {activeTab === 'events' && <EventsTab events={mediaEvents} />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function TranscriptsTab({
  transcripts,
  isActive,
  onCopy,
  onDownload,
  copied,
  transcriptEndRef,
}: {
  transcripts: Transcript[];
  isActive: boolean;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
  transcriptEndRef: React.RefObject<HTMLDivElement>;
}) {
  if (transcripts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Mic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-900 mb-1">No Transcripts Yet</h3>
        <p className="text-sm text-slate-500">
          {isActive
            ? 'Transcripts will appear here as participants speak'
            : 'No transcripts were recorded for this meeting'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-slate-900">Live Transcript</h2>
          {isActive && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Radio className="w-3 h-3 animate-pulse" />
              Recording
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto p-6 space-y-4">
        {transcripts.map((transcript, index) => {
          const prevSpeaker = index > 0 ? transcripts[index - 1].speaker_name : null;
          const showSpeaker = transcript.speaker_name !== prevSpeaker;

          return (
            <div key={transcript.id} className="group">
              {showSpeaker && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-medium text-slate-900">
                    {transcript.speaker_name || 'Unknown Speaker'}
                  </span>
                  {transcript.created_at && (
                    <span className="text-xs text-slate-400">
                      {format(new Date(transcript.created_at), 'HH:mm:ss')}
                    </span>
                  )}
                </div>
              )}
              <p className={`text-slate-700 ${showSpeaker ? 'ml-10' : 'ml-10'}`}>
                {transcript.content}
              </p>
            </div>
          );
        })}
        <div ref={transcriptEndRef} />
      </div>
    </div>
  );
}

function ChatTab({ messages, isActive }: { messages: ChatMessage[]; isActive: boolean }) {
  if (messages.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-900 mb-1">No Chat Messages</h3>
        <p className="text-sm text-slate-500">
          {isActive
            ? 'Chat messages will appear here as they are sent'
            : 'No chat messages were recorded for this meeting'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Meeting Chat</h2>
      </div>
      <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex items-start gap-3">
            <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-slate-900 text-sm">
                  {msg.sender_name || 'Unknown'}
                </span>
                {msg.recipient !== 'everyone' && (
                  <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    to {msg.recipient}
                  </span>
                )}
                {msg.created_at && (
                  <span className="text-xs text-slate-400">
                    {format(new Date(msg.created_at), 'HH:mm')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ParticipantsTab({ participants }: { participants: Participant[] }) {
  const active = participants.filter((p) => p.is_active);
  const inactive = participants.filter((p) => !p.is_active);

  return (
    <div className="space-y-6">
      {active.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">Active Participants</h2>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              {active.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {active.map((p) => (
              <ParticipantRow key={p.id} participant={p} />
            ))}
          </div>
        </div>
      )}

      {inactive.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <h2 className="font-semibold text-slate-900">Left Meeting</h2>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {inactive.length}
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {inactive.map((p) => (
              <ParticipantRow key={p.id} participant={p} />
            ))}
          </div>
        </div>
      )}

      {participants.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-semibold text-slate-900 mb-1">No Participants</h3>
          <p className="text-sm text-slate-500">
            Participant data will appear here when available
          </p>
        </div>
      )}
    </div>
  );
}

function ParticipantRow({ participant }: { participant: Participant }) {
  return (
    <div className="px-6 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        participant.is_active
          ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
          : 'bg-slate-200'
      }`}>
        <User className={`w-5 h-5 ${participant.is_active ? 'text-white' : 'text-slate-500'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">
            {participant.user_name || 'Unknown Participant'}
          </span>
          {participant.role === 'host' && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              Host
            </span>
          )}
          {participant.role === 'co-host' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              Co-host
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {participant.email && (
            <span className="text-xs text-slate-500">{participant.email}</span>
          )}
          {participant.joined_at && (
            <span className="text-xs text-slate-400">
              Joined {format(new Date(participant.joined_at), 'HH:mm')}
            </span>
          )}
          {participant.left_at && (
            <span className="text-xs text-slate-400">
              &middot; Left {format(new Date(participant.left_at), 'HH:mm')}
            </span>
          )}
        </div>
      </div>
      {participant.is_active && (
        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
      )}
    </div>
  );
}

function EventsTab({ events }: { events: MediaEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <Activity className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="font-semibold text-slate-900 mb-1">No Media Events</h3>
        <p className="text-sm text-slate-500">
          Media events will appear here as they are processed
        </p>
      </div>
    );
  }

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'audio':
        return Mic;
      case 'video':
        return Video;
      case 'screenshare':
        return Monitor;
      default:
        return Radio;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'audio':
        return 'bg-cyan-100 text-cyan-600';
      case 'video':
        return 'bg-blue-100 text-blue-600';
      case 'screenshare':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Media Events</h2>
      </div>
      <div className="max-h-[600px] overflow-y-auto divide-y divide-slate-100">
        {events.map((event) => {
          const Icon = getEventIcon(event.event_type);
          const colorClass = getEventColor(event.event_type);

          return (
            <div key={event.id} className="px-6 py-3 flex items-center gap-4">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClass}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 capitalize">
                    {event.event_type}
                  </span>
                  <span className="text-xs text-slate-500">{event.action}</span>
                </div>
                {event.bytes_processed > 0 && (
                  <span className="text-xs text-slate-400">
                    {(event.bytes_processed / 1024).toFixed(1)} KB processed
                  </span>
                )}
              </div>
              {event.created_at && (
                <span className="text-xs text-slate-400">
                  {format(new Date(event.created_at), 'HH:mm:ss')}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
