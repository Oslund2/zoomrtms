import { useState } from 'react';
import { X, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  meetingId: string;
  meetingTopic: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  meetingId,
  meetingTopic,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await supabase.from('transcripts').delete().eq('meeting_id', meetingId);
      await supabase.from('participants').delete().eq('meeting_id', meetingId);
      await supabase.from('chat_messages').delete().eq('meeting_id', meetingId);
      await supabase.from('media_events').delete().eq('meeting_id', meetingId);

      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meetingId);

      if (deleteError) throw deleteError;

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete meeting');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
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

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Delete Meeting</h2>
              <p className="text-sm text-slate-500">This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800 font-medium mb-1">
                Are you sure you want to delete this meeting?
              </p>
              <p className="text-sm text-amber-700">
                "<span className="font-medium">{meetingTopic}</span>" and all associated data (transcripts, participants, chat messages) will be permanently removed.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5" />
                  Delete Meeting
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
