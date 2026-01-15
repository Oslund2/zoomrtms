import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import type { Meeting } from '../types/database';

interface MeetingWithCounts extends Meeting {
  participants: { count: number }[];
  transcripts: { count: number }[];
}

export function useMeetingHistory() {
  const { isDemoMode, demoData } = useDemoMode();
  const [meetings, setMeetings] = useState<MeetingWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMeetings = useCallback(async () => {
    setLoading(true);

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 500));

      const meetingsWithCounts: MeetingWithCounts[] = demoData.meetings.map(meeting => {
        const participants = demoData.participants.get(meeting.id) || [];
        const transcripts = meeting.id === demoData.meetings[0]?.id ? demoData.transcripts : [];

        return {
          ...meeting,
          participants: [{ count: participants.length }],
          transcripts: [{ count: transcripts.length }],
        };
      });

      setMeetings(meetingsWithCounts);
      setLoading(false);
      return;
    }

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
  }, [isDemoMode, demoData]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return { meetings, loading, refetch: fetchMeetings };
}
