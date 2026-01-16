import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Radio,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Mic,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MeetingConnection {
  id: string;
  meeting_uuid: string;
  topic: string;
  room_type: string;
  room_number: number | null;
  status: string;
  started_at: string;
  host_name: string;
  participant_count: number;
  transcript_count: number;
  audio_chunks: number;
  last_activity: string;
}

interface HealthMetric {
  label: string;
  value: string | number;
  status: 'good' | 'warning' | 'error';
  icon: any;
}

export default function RTMSMonitor() {
  const navigate = useNavigate();
  const [connections, setConnections] = useState<MeetingConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchConnections = async () => {
    try {
      const { data: meetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'active')
        .order('started_at', { ascending: false });

      if (meetings) {
        const connectionsWithStats = await Promise.all(
          meetings.map(async (meeting) => {
            const [participants, transcripts, mediaEvents] = await Promise.all([
              supabase
                .from('participants')
                .select('*', { count: 'exact', head: true })
                .eq('meeting_id', meeting.id)
                .eq('is_active', true),
              supabase
                .from('transcripts')
                .select('created_at', { count: 'exact', head: true })
                .eq('meeting_id', meeting.id)
                .order('created_at', { ascending: false })
                .limit(1),
              supabase
                .from('media_events')
                .select('*', { count: 'exact' })
                .eq('meeting_id', meeting.id)
                .eq('event_type', 'rtms'),
            ]);

            const lastTranscript = transcripts.data?.[0];

            return {
              id: meeting.id,
              meeting_uuid: meeting.meeting_uuid,
              topic: meeting.topic || 'Untitled Meeting',
              room_type: meeting.room_type || 'main',
              room_number: meeting.room_number,
              status: meeting.status,
              started_at: meeting.started_at,
              host_name: meeting.host_name || 'Unknown',
              participant_count: participants.count || 0,
              transcript_count: transcripts.count || 0,
              audio_chunks: mediaEvents.count || 0,
              last_activity: lastTranscript?.created_at || meeting.started_at,
            };
          })
        );

        setConnections(connectionsWithStats);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();

    if (autoRefresh) {
      const interval = setInterval(fetchConnections, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const healthMetrics: HealthMetric[] = [
    {
      label: 'Active Streams',
      value: connections.length,
      status: connections.length > 0 ? 'good' : 'warning',
      icon: Radio,
    },
    {
      label: 'Total Participants',
      value: connections.reduce((sum, c) => sum + c.participant_count, 0),
      status: 'good',
      icon: Users,
    },
    {
      label: 'Transcripts Processed',
      value: connections.reduce((sum, c) => sum + c.transcript_count, 0),
      status: 'good',
      icon: MessageSquare,
    },
    {
      label: 'Health Status',
      value: connections.every((c) => isConnectionHealthy(c)) ? 'Healthy' : 'Issues',
      status: connections.every((c) => isConnectionHealthy(c)) ? 'good' : 'warning',
      icon: Activity,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-500 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">RTMS Connection Monitor</h1>
                <p className="text-xs text-slate-500">Real-time stream health and diagnostics</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded"
                />
                Auto-refresh
              </label>
              <button
                onClick={() => fetchConnections()}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Refresh Now"
              >
                <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {healthMetrics.map((metric) => (
            <HealthCard key={metric.label} metric={metric} />
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Active RTMS Connections</h2>
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Updating...
              </div>
            )}
          </div>

          {connections.length === 0 ? (
            <div className="p-12 text-center">
              <Radio className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Active Streams</h3>
              <p className="text-slate-500 mb-6">
                Start a Zoom meeting with RTMS enabled to see connections here
              </p>
              <button
                onClick={() => navigate('/setup')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Go to Setup
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {connections.map((connection) => (
                <ConnectionCard key={connection.id} connection={connection} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthCard({ metric }: { metric: HealthMetric }) {
  const Icon = metric.icon;
  const statusColors = {
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className={`rounded-2xl border p-6 ${statusColors[metric.status]}`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        {metric.status === 'good' && <CheckCircle2 className="w-5 h-5" />}
        {metric.status === 'warning' && <AlertTriangle className="w-5 h-5" />}
        {metric.status === 'error' && <XCircle className="w-5 h-5" />}
      </div>
      <div className="text-3xl font-bold mb-1">{metric.value}</div>
      <div className="text-sm font-medium opacity-80">{metric.label}</div>
    </div>
  );
}

function ConnectionCard({ connection }: { connection: MeetingConnection }) {
  const isHealthy = isConnectionHealthy(connection);
  const timeSinceStart = getTimeSince(connection.started_at);
  const timeSinceActivity = getTimeSince(connection.last_activity);

  const getRoomLabel = () => {
    if (connection.room_type === 'main') return 'Main Room';
    return `Breakout Room ${connection.room_number}`;
  };

  return (
    <div className="px-6 py-5 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isHealthy ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            <Radio className={`w-6 h-6 ${isHealthy ? 'text-emerald-600' : 'text-amber-600'}`} />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-semibold text-slate-900">{connection.topic}</h3>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                {getRoomLabel()}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {connection.host_name}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Started {timeSinceStart} ago
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <MetricBadge
                icon={Users}
                label="Participants"
                value={connection.participant_count}
                status={connection.participant_count > 0 ? 'good' : 'warning'}
              />
              <MetricBadge
                icon={MessageSquare}
                label="Transcripts"
                value={connection.transcript_count}
                status={connection.transcript_count > 0 ? 'good' : 'warning'}
              />
              <MetricBadge
                icon={Mic}
                label="Audio Events"
                value={connection.audio_chunks}
                status={'good'}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isHealthy ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">Healthy</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Inactive</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-slate-500">
        <span>Last activity: {timeSinceActivity} ago</span>
        <span>UUID: {connection.meeting_uuid.substring(0, 16)}...</span>
      </div>
    </div>
  );
}

function MetricBadge({
  icon: Icon,
  label,
  value,
  status,
}: {
  icon: any;
  label: string;
  value: number;
  status: 'good' | 'warning';
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      status === 'good' ? 'bg-slate-100' : 'bg-amber-50'
    }`}>
      <Icon className={`w-4 h-4 ${status === 'good' ? 'text-slate-600' : 'text-amber-600'}`} />
      <div>
        <div className={`text-lg font-semibold ${
          status === 'good' ? 'text-slate-900' : 'text-amber-900'
        }`}>
          {value}
        </div>
        <div className="text-xs text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function isConnectionHealthy(connection: MeetingConnection): boolean {
  const lastActivityTime = new Date(connection.last_activity).getTime();
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  return now - lastActivityTime < fiveMinutes && connection.participant_count > 0;
}

function getTimeSince(timestamp: string): string {
  const now = Date.now();
  const time = new Date(timestamp).getTime();
  const diff = now - time;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
}
