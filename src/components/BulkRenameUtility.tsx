import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateMeetingName, fixNonCompliantName } from '../lib/namingUtils';
import type { Meeting } from '../types/database';

interface NonCompliantMeeting extends Meeting {
  suggestedName: string;
  issues: string[];
}

export default function BulkRenameUtility() {
  const [meetings, setMeetings] = useState<NonCompliantMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedMeetings, setSelectedMeetings] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadNonCompliantMeetings();
  }, []);

  const loadNonCompliantMeetings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const nonCompliant: NonCompliantMeeting[] = [];

      if (data) {
        for (const meeting of data) {
          const validation = validateMeetingName(
            meeting.topic || '',
            meeting.room_type as 'main' | 'breakout',
            meeting.room_number || undefined
          );

          if (!validation.isValid) {
            const suggestedName = fixNonCompliantName(
              meeting.topic || 'Untitled Meeting',
              meeting.room_type as 'main' | 'breakout',
              meeting.room_number || undefined
            );

            nonCompliant.push({
              ...meeting,
              suggestedName,
              issues: validation.issues,
            });
          }
        }
      }

      setMeetings(nonCompliant);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedMeetings.size === meetings.length) {
      setSelectedMeetings(new Set());
    } else {
      setSelectedMeetings(new Set(meetings.map(m => m.id)));
    }
  };

  const handleSelectMeeting = (id: string) => {
    const newSelected = new Set(selectedMeetings);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMeetings(newSelected);
  };

  const handleFixSelected = async () => {
    if (selectedMeetings.size === 0) return;

    setProcessing(true);
    try {
      const updates = meetings
        .filter(m => selectedMeetings.has(m.id))
        .map(m => ({
          id: m.id,
          topic: m.suggestedName,
        }));

      for (const update of updates) {
        await supabase
          .from('meetings')
          .update({ topic: update.topic })
          .eq('id', update.id);
      }

      setSuccessMessage(`Successfully renamed ${updates.length} meeting(s)`);
      setSelectedMeetings(new Set());
      await loadNonCompliantMeetings();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error fixing meetings:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleFixSingle = async (meeting: NonCompliantMeeting) => {
    setProcessing(true);
    try {
      await supabase
        .from('meetings')
        .update({ topic: meeting.suggestedName })
        .eq('id', meeting.id);

      setSuccessMessage('Meeting renamed successfully');
      await loadNonCompliantMeetings();

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error fixing meeting:', error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (meetings.length === 0) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-emerald-900 mb-1">All Clear!</h3>
        <p className="text-sm text-emerald-700">
          All active meetings have compliant naming conventions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-emerald-700">{successMessage}</p>
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-medium text-amber-900 mb-1">
            {meetings.length} Meeting{meetings.length !== 1 ? 's' : ''} Need{meetings.length === 1 ? 's' : ''} Attention
          </h3>
          <p className="text-sm text-amber-700">
            These meetings don't follow Zoom's naming conventions and may not be detected correctly by RTMS.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {selectedMeetings.size === meetings.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-slate-500">
            {selectedMeetings.size} selected
          </span>
        </div>
        <button
          onClick={handleFixSelected}
          disabled={selectedMeetings.size === 0 || processing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Fix Selected
            </>
          )}
        </button>
      </div>

      <div className="space-y-3">
        {meetings.map((meeting) => (
          <div
            key={meeting.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedMeetings.has(meeting.id)}
                onChange={() => handleSelectMeeting(meeting.id)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                        meeting.room_type === 'main'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {meeting.room_type === 'main' ? 'Main Room' : `Breakout ${meeting.room_number}`}
                      </span>
                      <span className="text-xs text-slate-500">
                        {meeting.host_name || 'Unknown Host'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 font-medium truncate">
                      {meeting.topic || 'Untitled Meeting'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFixSingle(meeting)}
                    disabled={processing}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-medium transition-colors flex-shrink-0"
                  >
                    Fix
                  </button>
                </div>

                {meeting.issues.length > 0 && (
                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-700 font-medium mb-1">Issues:</p>
                    {meeting.issues.map((issue, idx) => (
                      <p key={idx} className="text-xs text-red-600">• {issue}</p>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 line-through truncate max-w-[200px]">
                    {meeting.topic || 'Untitled Meeting'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="text-emerald-700 font-medium truncate">
                    {meeting.suggestedName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
