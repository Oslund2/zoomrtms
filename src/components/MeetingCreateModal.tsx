import { useState } from 'react';
import { X, Video, Loader2, CheckCircle2, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface MeetingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: { id: string; meeting_uuid: string; topic: string }) => void;
}

export default function MeetingCreateModal({ isOpen, onClose, onSuccess }: MeetingCreateModalProps) {
  const [topic, setTopic] = useState('');
  const [hostName, setHostName] = useState('');
  const [roomType, setRoomType] = useState<'main' | 'breakout'>('main');
  const [roomNumber, setRoomNumber] = useState<number>(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const meetingUuid = crypto.randomUUID();
      const { data, error: insertError } = await supabase
        .from('meetings')
        .insert({
          meeting_uuid: meetingUuid,
          topic: topic.trim() || 'Untitled Meeting',
          host_name: hostName.trim() || 'Manual Entry',
          status: 'active',
          room_type: roomType,
          room_number: roomType === 'breakout' ? roomNumber : null,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      onSuccess({
        id: data.id,
        meeting_uuid: data.meeting_uuid,
        topic: data.topic || 'Untitled Meeting',
      });

      setTopic('');
      setHostName('');
      setRoomType('main');
      setRoomNumber(1);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create Meeting</h2>
              <p className="text-sm text-slate-500">Add a new meeting for testing or manual entry</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meeting Topic
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Team Standup, Project Review"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Host Name
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="e.g., John Doe"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRoomType('main')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  roomType === 'main'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  roomType === 'main' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Video className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${roomType === 'main' ? 'text-blue-900' : 'text-slate-700'}`}>
                    Main Room
                  </p>
                  <p className="text-xs text-slate-500">Primary conference</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRoomType('breakout')}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  roomType === 'breakout'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  roomType === 'breakout' ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className={`font-medium ${roomType === 'breakout' ? 'text-blue-900' : 'text-slate-700'}`}>
                    Breakout Room
                  </p>
                  <p className="text-xs text-slate-500">Sub-room session</p>
                </div>
              </button>
            </div>
          </div>

          {roomType === 'breakout' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Room Number
              </label>
              <select
                value={roomNumber}
                onChange={(e) => setRoomNumber(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <option key={num} value={num}>
                    Breakout Room {num}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Create Meeting
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
