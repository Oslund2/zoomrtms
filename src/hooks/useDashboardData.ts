import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import type { Meeting, Transcript } from '../types/database';

interface MeetingWithStats extends Meeting {
  participant_count: number;
  transcript_count: number;
}

export function useDashboardData() {
  const { isDemoMode, demoData } = useDemoMode();
  const [activeMeetings, setActiveMeetings] = useState<MeetingWithStats[]>([]);
  const [recentTranscripts, setRecentTranscripts] = useState<(Transcript & { meeting_topic?: string })[]>([]);
  const [stats, setStats] = useState({
    totalMeetings: 0,
    activeMeetings: 0,
    totalParticipants: 0,
    totalTranscripts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const meetings = demoData.meetings.filter(m => m.status === 'active');
      const meetingsWithStats: MeetingWithStats[] = meetings.map(meeting => {
        const participants = demoData.participants.get(meeting.id) || [];
        const activeParticipants = participants.filter(p => p.is_active);

        return {
          ...meeting,
          participant_count: activeParticipants.length,
          transcript_count: 0,
        };
      });

      const recentTranscriptsWithTopic = demoData.transcripts.slice(0, 5).map(t => ({
        ...t,
        meeting_topic: meetings[0]?.topic || 'Meeting',
      }));

      const allParticipants = Array.from(demoData.participants.values()).flat();
      const activeParticipants = allParticipants.filter(p => p.is_active);

      setActiveMeetings(meetingsWithStats);
      setRecentTranscripts(recentTranscriptsWithTopic);
      setStats({
        totalMeetings: demoData.meetings.length,
        activeMeetings: meetings.length,
        totalParticipants: activeParticipants.length,
        totalTranscripts: demoData.transcripts.length,
      });

      setLoading(false);
      return;
    }

    const [meetingsRes, participantsRes, transcriptsRes] = await Promise.all([
      supabase.from('meetings').select('*').eq('status', 'active').order('started_at', { ascending: false }),
      supabase.from('participants').select('meeting_id, is_active'),
      supabase.from('transcripts').select('*, meetings(topic)').order('created_at', { ascending: false }).limit(5),
    ]);

    const { count: totalMeetings } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true });

    const meetings = meetingsRes.data || [];
    const participants = participantsRes.data || [];

    const meetingsWithStats: MeetingWithStats[] = meetings.map((meeting) => {
      const meetingParticipants = participants.filter(
        (p) => p.meeting_id === meeting.id && p.is_active
      );
      return {
        ...meeting,
        participant_count: meetingParticipants.length,
        transcript_count: 0,
      };
    });

    const recentTranscriptsWithTopic = (transcriptsRes.data || []).map((t: any) => ({
      ...t,
      meeting_topic: t.meetings?.topic,
    }));

    setActiveMeetings(meetingsWithStats);
    setRecentTranscripts(recentTranscriptsWithTopic);
    setStats({
      totalMeetings: totalMeetings || 0,
      activeMeetings: meetings.length,
      totalParticipants: participants.filter((p) => p.is_active).length,
      totalTranscripts: 0,
    });

    setLoading(false);
  }, [isDemoMode, demoData]);

  const fetchTranscriptsOnly = useCallback(async () => {
    if (isDemoMode) {
      const meetings = demoData.meetings.filter(m => m.status === 'active');
      const recentTranscriptsWithTopic = demoData.transcripts.slice(0, 5).map(t => ({
        ...t,
        meeting_topic: meetings[0]?.topic || 'Meeting',
      }));
      setRecentTranscripts(recentTranscriptsWithTopic);
      setLastRefreshTime(new Date());
      return;
    }

    const transcriptsRes = await supabase
      .from('transcripts')
      .select('*, meetings(topic)')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentTranscriptsWithTopic = (transcriptsRes.data || []).map((t: any) => ({
      ...t,
      meeting_topic: t.meetings?.topic,
    }));

    setRecentTranscripts(recentTranscriptsWithTopic);
    setLastRefreshTime(new Date());
  }, [isDemoMode, demoData]);

  useEffect(() => {
    fetchData();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'participants' }, fetchData)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transcripts' }, fetchTranscriptsOnly)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, fetchTranscriptsOnly, isDemoMode]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTranscriptsOnly();
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchTranscriptsOnly]);

  return { activeMeetings, recentTranscripts, stats, loading, refetch: fetchData, lastRefreshTime };
}
