import { useState, useEffect } from 'react';
import { Terminal, Copy, Play, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';

type RoomType = 'main' | 'breakout';

interface BreakoutRoomLabel {
  roomNumber: number;
  label: string;
}

export default function ApiTesterTab() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [roomType, setRoomType] = useState<RoomType>('main');
  const [roomNumber, setRoomNumber] = useState<number>(1);
  const [testMessage, setTestMessage] = useState('This is an Ambient Intelligence test from Scripps. HELLO WORLD');
  const [speakerName, setSpeakerName] = useState('Test Speaker');
  const [participantId, setParticipantId] = useState('test-participant-001');
  const [copySuccess, setCopySuccess] = useState(false);
  const [executeStatus, setExecuteStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [testRecordCount, setTestRecordCount] = useState<{ meetings: number; transcripts: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [breakoutRoomLabels, setBreakoutRoomLabels] = useState<BreakoutRoomLabel[]>([]);

  useEffect(() => {
    loadMeetings();
    loadTestRecordCount();
  }, []);

  useEffect(() => {
    if (selectedMeetingId) {
      loadBreakoutRoomLabels();
    }
  }, [selectedMeetingId]);

  const loadMeetings = async () => {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMeetings(data);
      if (data.length > 0 && !selectedMeetingId) {
        setSelectedMeetingId(data[0].id);
      }
    }
  };

  const loadTestRecordCount = async () => {
    const { data: meetingData } = await supabase
      .from('meetings')
      .select('id, topic')
      .or('topic.ilike.%test%,topic.ilike.%Test Meeting%');

    const meetingIds = meetingData?.map(m => m.id) || [];

    if (meetingIds.length > 0) {
      const { data: transcriptData } = await supabase
        .from('transcripts')
        .select('id')
        .in('meeting_id', meetingIds);

      setTestRecordCount({
        meetings: meetingData?.length || 0,
        transcripts: transcriptData?.length || 0
      });
    } else {
      setTestRecordCount({ meetings: 0, transcripts: 0 });
    }
  };

  const loadBreakoutRoomLabels = async () => {
    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (!selectedMeeting) return;

    const { data, error } = await supabase
      .from('meetings')
      .select('room_number, topic')
      .eq('room_type', 'breakout')
      .not('room_number', 'is', null)
      .order('room_number');

    if (!error && data) {
      const labels: BreakoutRoomLabel[] = data.map(meeting => ({
        roomNumber: meeting.room_number!,
        label: meeting.topic || `Breakout Room ${meeting.room_number}`
      }));
      setBreakoutRoomLabels(labels);
    }
  };

  const createNewTestMeeting = async () => {
    setLoading(true);
    const newMeetingUuid = crypto.randomUUID();

    const { data, error } = await supabase
      .from('meetings')
      .insert({
        meeting_uuid: newMeetingUuid,
        topic: `Test Meeting - ${new Date().toLocaleString()}`,
        status: 'in_progress',
        room_type: roomType,
        room_number: roomType === 'breakout' ? roomNumber : null,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (!error && data) {
      await loadMeetings();
      setSelectedMeetingId(data.id);
      await loadTestRecordCount();
      await loadBreakoutRoomLabels();
    }
    setLoading(false);
  };

  const generatePowerShellCommand = () => {
    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (!selectedMeeting) return '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const payload: Record<string, unknown> = {
      meeting_uuid: selectedMeeting.meeting_uuid,
      participant_id: participantId,
      speaker_name: speakerName,
      content: testMessage,
      timestamp_ms: '[DateTimeOffset]::Now.ToUnixTimeMilliseconds()',
      is_final: true,
      room_type: roomType
    };

    if (roomType === 'breakout') {
      payload.room_number = roomNumber;
    }

    const payloadStr = JSON.stringify(payload, null, 2)
      .replace('"[DateTimeOffset]::Now.ToUnixTimeMilliseconds()"', '[DateTimeOffset]::Now.ToUnixTimeMilliseconds()');

    return `$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer ${anonKey}"
}

$body = @'
${payloadStr}
'@

Invoke-RestMethod -Uri "${supabaseUrl}/functions/v1/rtms-data" -Method Post -Headers $headers -Body $body`;
  };

  const copyToClipboard = async () => {
    const command = generatePowerShellCommand();
    await navigator.clipboard.writeText(command);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const executeTest = async () => {
    setLoading(true);
    setExecuteStatus(null);

    const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
    if (!selectedMeeting) {
      setExecuteStatus({ success: false, message: 'No meeting selected' });
      setLoading(false);
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const payload: Record<string, unknown> = {
      meeting_uuid: selectedMeeting.meeting_uuid,
      participant_id: participantId,
      speaker_name: speakerName,
      content: testMessage,
      timestamp_ms: Date.now(),
      is_final: true,
      room_type: roomType
    };

    if (roomType === 'breakout') {
      payload.room_number = roomNumber;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/rtms-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        setExecuteStatus({
          success: true,
          message: `Test executed successfully! Transcript ID: ${result.transcript_id || 'N/A'}`
        });
        await loadTestRecordCount();
      } else {
        const errorText = await response.text();
        setExecuteStatus({ success: false, message: `Error: ${response.status} - ${errorText}` });
      }
    } catch (error) {
      setExecuteStatus({ success: false, message: `Network error: ${(error as Error).message}` });
    }

    setLoading(false);
  };

  const clearTestData = async () => {
    if (!testRecordCount || testRecordCount.meetings === 0) return;

    const confirmed = confirm(
      `This will delete ${testRecordCount.meetings} test meeting(s) and ${testRecordCount.transcripts} transcript(s). Continue?`
    );

    if (!confirmed) return;

    setLoading(true);

    const { data: testMeetings } = await supabase
      .from('meetings')
      .select('id')
      .or('topic.ilike.%test%,topic.ilike.%Test Meeting%');

    const meetingIds = testMeetings?.map(m => m.id) || [];

    if (meetingIds.length > 0) {
      await supabase.from('transcripts').delete().in('meeting_id', meetingIds);
      await supabase.from('participants').delete().in('meeting_id', meetingIds);
      await supabase.from('chat_messages').delete().in('meeting_id', meetingIds);
      await supabase.from('media_events').delete().in('meeting_id', meetingIds);
      await supabase.from('meetings').delete().in('id', meetingIds);
    }

    await loadMeetings();
    await loadTestRecordCount();
    setExecuteStatus({ success: true, message: 'Test data cleared successfully!' });
    setLoading(false);
  };

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="flex items-start gap-3">
        <Terminal className="w-6 h-6 text-blue-600 mt-1" />
        <div>
          <h2 className="text-xl font-semibold text-slate-900">RTMS Test Generator</h2>
          <p className="text-slate-500 text-sm mt-1">Generate PowerShell commands to test RTMS data ingestion</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Meeting Selection</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Meeting
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedMeetingId}
                  onChange={(e) => setSelectedMeetingId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {meetings.map((meeting) => (
                    <option key={meeting.id} value={meeting.id}>
                      {meeting.topic || 'Untitled Meeting'} ({meeting.meeting_uuid.slice(0, 8)}...)
                    </option>
                  ))}
                </select>
                <button
                  onClick={createNewTestMeeting}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  New Test
                </button>
              </div>
            </div>

            {selectedMeeting && (
              <div className="bg-white rounded-lg p-3 border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Meeting UUID</div>
                <div className="font-mono text-sm text-slate-900">{selectedMeeting.meeting_uuid}</div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Room Configuration</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Room Type
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="main">Main Conference Room</option>
                <option value="breakout">Breakout Room</option>
              </select>
            </div>

            {roomType === 'breakout' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Breakout Room Number
                </label>
                <select
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => {
                    const labelInfo = breakoutRoomLabels.find(label => label.roomNumber === num);
                    const displayLabel = labelInfo ? labelInfo.label : `Breakout Room ${num}`;
                    return (
                      <option key={num} value={num}>{displayLabel}</option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900 mb-3">Test Message Configuration</h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Speaker Name
              </label>
              <input
                type="text"
                value={speakerName}
                onChange={(e) => setSpeakerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Participant ID
              </label>
              <input
                type="text"
                value={participantId}
                onChange={(e) => setParticipantId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Test Message Content
              </label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-slate-900">Generated PowerShell Command</h3>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 text-sm"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={executeTest}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Execute
              </button>
            </div>
          </div>

          <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
            {generatePowerShellCommand()}
          </pre>

          {executeStatus && (
            <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
              executeStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {executeStatus.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              )}
              <span className="text-sm">{executeStatus.message}</span>
            </div>
          )}
        </div>

        {testRecordCount && testRecordCount.meetings > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-slate-900 mb-2">Test Data Cleanup</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Found {testRecordCount.meetings} test meeting(s) with {testRecordCount.transcripts} transcript(s)
                </p>
              </div>
              <button
                onClick={clearTestData}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Clear Test Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
