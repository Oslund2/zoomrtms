import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Search,
  Calendar,
  Clock,
  Users,
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';
import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';

interface MeetingWithCounts extends Meeting {
  participants: { count: number }[];
  transcripts: { count: number }[];
}

export default function MeetingHistory() {
  const [meetings, setMeetings] = useState<MeetingWithCounts[]>([]);
  const [filteredMeetings, setFilteredMeetings] = useState<MeetingWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    fetchMeetings();
  }, []);

  useEffect(() => {
    filterMeetings();
  }, [meetings, searchQuery, statusFilter]);

  async function fetchMeetings() {
    setLoading(true);

    const { data, error } = await supabase
      .from('meetings')
      .select(`
        *,
        participants(count),
        transcripts(count)
      `)
      .order('started_at', { ascending: false });

    if (!error && data) {
      setMeetings(data as MeetingWithCounts[]);
    }

    setLoading(false);
  }

  function filterMeetings() {
    let filtered = [...meetings];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((m) => m.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.topic?.toLowerCase().includes(query) ||
          m.host_name?.toLowerCase().includes(query) ||
          m.meeting_uuid.toLowerCase().includes(query)
      );
    }

    setFilteredMeetings(filtered);
  }

  const groupedMeetings = groupMeetingsByDate(filteredMeetings);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Meeting History</h1>
        <p className="text-slate-500 mt-1">View and search all processed RTMS meetings</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by topic, host, or meeting ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 rounded-full"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-500 mt-4">Loading meetings...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-12 text-center">
            <Video className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-1">No Meetings Found</h3>
            <p className="text-sm text-slate-500">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Meetings will appear here once RTMS streams start'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {Object.entries(groupedMeetings).map(([dateLabel, dateMeetings]) => (
              <div key={dateLabel}>
                <div className="px-6 py-3 bg-slate-50 sticky top-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">{dateLabel}</span>
                    <span className="text-xs text-slate-400">({dateMeetings.length})</span>
                  </div>
                </div>
                {dateMeetings.map((meeting) => (
                  <MeetingRow key={meeting.id} meeting={meeting} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MeetingRow({ meeting }: { meeting: MeetingWithCounts }) {
  const participantCount = meeting.participants?.[0]?.count || 0;
  const transcriptCount = meeting.transcripts?.[0]?.count || 0;
  const isActive = meeting.status === 'active';

  const duration =
    meeting.started_at && meeting.ended_at
      ? formatDistanceToNow(new Date(meeting.started_at), { addSuffix: false })
      : meeting.started_at
      ? formatDistanceToNow(new Date(meeting.started_at))
      : null;

  return (
    <Link
      to={`/meeting/${meeting.id}`}
      className="block px-6 py-4 hover:bg-slate-50 transition-colors"
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isActive
              ? 'bg-gradient-to-br from-emerald-400 to-teal-500'
              : 'bg-gradient-to-br from-slate-400 to-slate-500'
          }`}
        >
          <Video className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-900 truncate">
              {meeting.topic || 'Untitled Meeting'}
            </h3>
            {isActive && (
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-2">
            {meeting.host_name || 'Unknown Host'}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {meeting.started_at && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(meeting.started_at), 'HH:mm')}
                {duration && ` (${duration})`}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Users className="w-3.5 h-3.5" />
              {participantCount} participants
            </span>
            {transcriptCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-cyan-600">
                {transcriptCount} transcripts
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0" />
      </div>
    </Link>
  );
}

function groupMeetingsByDate(meetings: MeetingWithCounts[]): Record<string, MeetingWithCounts[]> {
  const groups: Record<string, MeetingWithCounts[]> = {};

  meetings.forEach((meeting) => {
    const date = meeting.started_at ? new Date(meeting.started_at) : new Date(meeting.created_at);
    let label: string;

    if (isToday(date)) {
      label = 'Today';
    } else if (isYesterday(date)) {
      label = 'Yesterday';
    } else if (isThisWeek(date)) {
      label = format(date, 'EEEE');
    } else {
      label = format(date, 'MMMM d, yyyy');
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(meeting);
  });

  return groups;
}
