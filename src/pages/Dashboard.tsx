import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Users,
  MessageSquare,
  Radio,
  Clock,
  ArrowRight,
  Mic,
  MonitorPlay,
  Filter,
  Layers,
  Zap,
  Plus,
  Pencil,
  Trash2
} from 'lucide-react';
import type { Meeting } from '../types/database';
import { formatDistanceToNow, format } from 'date-fns';
import RoomGrid from '../components/RoomGrid';
import MeetingCreateModal from '../components/MeetingCreateModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import NamingWarningBanner from '../components/NamingWarningBanner';
import { useDashboardData } from '../hooks/useDashboardData';
import { useDemoMode } from '../contexts/DemoModeContext';

interface MeetingWithStats extends Meeting {
  participant_count: number;
  transcript_count: number;
}

type RoomFilter = 'all' | 'main' | 'breakout';

export default function Dashboard() {
  const { activeMeetings, recentTranscripts, stats, loading, refetch, lastRefreshTime } = useDashboardData();
  const { isDemoMode, isPaused } = useDemoMode();
  const [roomFilter, setRoomFilter] = useState<RoomFilter>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [deleteMeeting, setDeleteMeeting] = useState<{ id: string; topic: string } | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isLive = isDemoMode ? !isPaused : stats.activeMeetings > 0;

  const handleMeetingCreated = (meeting: { id: string; meeting_uuid: string; topic: string }) => {
    const action = editMeeting ? 'updated' : 'created';
    setSuccessMessage(`Meeting "${meeting.topic}" ${action} successfully`);
    setTimeout(() => setSuccessMessage(null), 4000);
    setEditMeeting(null);
    refetch();
  };

  const handleEditMeeting = (meeting: MeetingWithStats) => {
    setEditMeeting(meeting);
    setShowCreateModal(true);
  };

  const handleDeleteMeeting = (meeting: MeetingWithStats) => {
    setDeleteMeeting({ id: meeting.id, topic: meeting.topic || 'Untitled Meeting' });
  };

  const handleDeleteSuccess = () => {
    setSuccessMessage(`Meeting deleted successfully`);
    setTimeout(() => setSuccessMessage(null), 4000);
    setDeleteMeeting(null);
    refetch();
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setEditMeeting(null);
  };

  const filteredMeetings = activeMeetings.filter((meeting) => {
    if (roomFilter === 'all') return true;
    return meeting.room_type === roomFilter;
  });

  const participantCounts: Record<string, number> = {};
  activeMeetings.forEach((meeting) => {
    participantCounts[meeting.id] = meeting.participant_count;
  });

  return (
    <div className="p-6 lg:p-8">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl shadow-lg">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Video className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-800">{successMessage}</p>
          </div>
        </div>
      )}

      <MeetingCreateModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        onSuccess={handleMeetingCreated}
        editMeeting={editMeeting}
      />

      {deleteMeeting && (
        <DeleteConfirmModal
          isOpen={true}
          onClose={() => setDeleteMeeting(null)}
          onSuccess={handleDeleteSuccess}
          meetingId={deleteMeeting.id}
          meetingTopic={deleteMeeting.topic}
        />
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Monitor your Zoom RTMS streams in real-time</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">New Meeting</span>
        </button>
      </div>

      <div className="mb-6">
        <NamingWarningBanner />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Radio}
          label="Active Meetings"
          value={stats.activeMeetings}
          color="emerald"
          pulse={stats.activeMeetings > 0}
        />
        <StatCard
          icon={Video}
          label="Total Meetings"
          value={stats.totalMeetings}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Active Participants"
          value={stats.totalParticipants}
          color="amber"
        />
        <StatCard
          icon={MessageSquare}
          label="Transcripts Today"
          value={stats.totalTranscripts}
          color="cyan"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Active Meetings</h2>
                <span className="text-sm text-slate-500">{activeMeetings.length} live</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={roomFilter}
                    onChange={(e) => setRoomFilter(e.target.value as RoomFilter)}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Rooms</option>
                    <option value="main">Main Room Only</option>
                    <option value="breakout">Breakout Rooms Only</option>
                  </select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-slate-500 mt-4">Loading meetings...</p>
              </div>
            ) : activeMeetings.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Video className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-medium text-slate-900 mb-1">No Active Meetings</h3>
                <p className="text-sm text-slate-500">
                  RTMS streams will appear here when Zoom meetings start
                </p>
                <Link
                  to="/setup"
                  className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Set up your first meeting →
                </Link>
              </div>
            ) : (
              <div className="p-6">
                {viewMode === 'grid' ? (
                  <RoomGrid
                    meetings={filteredMeetings}
                    participantCounts={participantCounts}
                    onEdit={handleEditMeeting}
                    onDelete={handleDeleteMeeting}
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        onEdit={() => handleEditMeeting(meeting)}
                        onDelete={() => handleDeleteMeeting(meeting)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-slate-900">Recent Transcripts</h2>
                {isLive && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-cyan-50 rounded-full">
                    <Zap className="w-3 h-3 text-cyan-600 animate-pulse" />
                    <span className="text-xs font-medium text-cyan-700">Live</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Auto-updates every 10s • Last refresh: {format(lastRefreshTime, 'HH:mm:ss')}
              </p>
            </div>

            {recentTranscripts.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No transcripts yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {recentTranscripts.map((transcript, index) => (
                  <Link
                    key={`${transcript.id}-${transcript.created_at}`}
                    to={`/meeting/${transcript.meeting_id}`}
                    className="block p-4 hover:bg-slate-50 transition-all duration-300 animate-in fade-in slide-in-from-top-2 cursor-pointer group"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'backwards'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-200 transition-colors">
                        <Mic className="w-4 h-4 text-cyan-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {transcript.speaker_name || 'Unknown Speaker'}
                        </p>
                        <p className="text-sm text-slate-500 line-clamp-2 mt-0.5 group-hover:text-slate-700 transition-colors">
                          {transcript.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {transcript.meeting_topic || 'Meeting'}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <MonitorPlay className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">RTMS Integration</h3>
                <p className="text-sm text-slate-400">Webhook Status</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Endpoint</span>
                <span className="text-sm font-medium text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Data Ingestion</span>
                <span className="text-sm font-medium text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-300">Real-time Sync</span>
                <span className="text-sm font-medium text-emerald-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'amber' | 'cyan';
  pulse?: boolean;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {pulse && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function MeetingCard({
  meeting,
  onEdit,
  onDelete,
}: {
  meeting: MeetingWithStats;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="p-4 hover:bg-slate-50 transition-colors rounded-xl border border-slate-100">
      <div className="flex items-start justify-between gap-4">
        <Link
          to={`/meeting/${meeting.id}`}
          className="flex items-start gap-4 min-w-0 flex-1"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0">
            <Video className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 truncate">
                {meeting.topic || 'Untitled Meeting'}
              </h3>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Hosted by {meeting.host_name || 'Unknown'}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Users className="w-3.5 h-3.5" />
                {meeting.participant_count} participants
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {meeting.started_at
                  ? formatDistanceToNow(new Date(meeting.started_at), { addSuffix: true })
                  : 'Just started'}
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.preventDefault();
              onEdit();
            }}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-amber-600"
            title="Edit meeting"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600"
            title="Delete meeting"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <Link
            to={`/meeting/${meeting.id}`}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
