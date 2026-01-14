import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  FileText,
  Upload,
  Trash2,
  Save,
  Radio,
  Users,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Eye,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from 'lucide-react';
import {
  usePromptConfigs,
  useExternalContexts,
  useAmbientStats,
  useRoomSummaries,
} from '../hooks/useAmbientData';
import { supabase } from '../lib/supabase';
import type { PromptConfig } from '../types/database';

export default function AdminOrchestrator() {
  const navigate = useNavigate();
  const { prompts, loading: promptsLoading, updatePrompt } = usePromptConfigs();
  const { contexts, loading: contextsLoading, deleteContext, refetch: refetchContexts } = useExternalContexts();
  const { stats } = useAmbientStats();
  const { summaries } = useRoomSummaries();

  const [activeTab, setActiveTab] = useState<'prompts' | 'context' | 'status'>('prompts');
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const globalPrompt = prompts.find((p) => p.scope === 'global');
  const roomPrompts = prompts.filter((p) => p.scope === 'room').sort((a, b) => (a.room_number ?? 0) - (b.room_number ?? 0));

  const handleEditPrompt = (prompt: PromptConfig) => {
    setEditingPrompt(prompt.id);
    setEditedText(prompt.prompt_text);
  };

  const handleSavePrompt = async (id: string) => {
    setSaving(true);
    await updatePrompt(id, { prompt_text: editedText });
    setEditingPrompt(null);
    setSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-context`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: formData,
        }
      );

      if (response.ok) {
        refetchContexts();
      }
    } catch (err) {
      console.error('Upload error:', err);
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-transcripts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'process_queue' }),
      });
    } catch (err) {
      console.error('Process error:', err);
    }
    setProcessing(false);
  };

  const getRoomName = (roomNumber: number | null) => {
    if (roomNumber === null || roomNumber === 0) return 'Main Room';
    return `Breakout ${roomNumber}`;
  };

  const getRoomSummary = (roomNumber: number) => {
    return summaries.find((s) => s.room_number === roomNumber);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Home"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Ambient Intelligence</h1>
                <p className="text-xs text-slate-500">Orchestrator Control Panel</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${stats.activeRooms > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span className="text-slate-600">{stats.activeRooms} Active Rooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <span className="text-slate-600">{stats.totalTopics} Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-slate-600">{stats.misalignments} Misalignments</span>
                </div>
              </div>

              <button
                onClick={handleProcessQueue}
                disabled={processing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                Process Queue
              </button>

              <a
                href="/display"
                target="_blank"
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Open Display
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-2 mb-6">
          {[
            { id: 'prompts', label: 'System Prompts', icon: Settings },
            { id: 'context', label: 'External Context', icon: FileText },
            { id: 'status', label: 'Room Status', icon: Radio },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {globalPrompt && (
              <PromptCard
                prompt={globalPrompt}
                isEditing={editingPrompt === globalPrompt.id}
                editedText={editedText}
                saving={saving}
                onEdit={() => handleEditPrompt(globalPrompt)}
                onSave={() => handleSavePrompt(globalPrompt.id)}
                onCancel={() => setEditingPrompt(null)}
                onTextChange={setEditedText}
                isGlobal
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roomPrompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  isEditing={editingPrompt === prompt.id}
                  editedText={editedText}
                  saving={saving}
                  onEdit={() => handleEditPrompt(prompt)}
                  onSave={() => handleSavePrompt(prompt.id)}
                  onCancel={() => setEditingPrompt(null)}
                  onTextChange={setEditedText}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Upload Reference Documents</h3>
              <p className="text-sm text-slate-500 mb-4">
                Upload PDFs, DOCX, or text files to provide external context for AI analysis.
                The AI will compare meeting discussions against these documents.
              </p>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 font-medium">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">PDF, DOCX, or TXT files</p>
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">Uploaded Documents</h3>
              </div>

              {contextsLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                </div>
              ) : contexts.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {contexts.map((ctx, index) => (
                    <div key={`${ctx.file_name}-${index}`} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{ctx.title}</p>
                          <p className="text-sm text-slate-500">
                            {ctx.file_type.toUpperCase()} - {new Date(ctx.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteContext(ctx.file_name)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Main Conference Room</h3>
              <RoomStatusCard
                roomNumber={0}
                isActive={stats.roomStatus.main}
                summary={getRoomSummary(0)}
              />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Breakout Rooms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((roomNumber) => (
                  <RoomStatusCard
                    key={roomNumber}
                    roomNumber={roomNumber}
                    isActive={stats.roomStatus.breakout.includes(roomNumber)}
                    summary={getRoomSummary(roomNumber)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PromptCard({
  prompt,
  isEditing,
  editedText,
  saving,
  onEdit,
  onSave,
  onCancel,
  onTextChange,
  isGlobal,
}: {
  prompt: PromptConfig;
  isEditing: boolean;
  editedText: string;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onTextChange: (text: string) => void;
  isGlobal?: boolean;
}) {
  const [expanded, setExpanded] = useState(isGlobal || false);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 overflow-hidden ${isGlobal ? '' : ''}`}>
      <div
        className={`px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 ${
          isGlobal ? 'bg-gradient-to-r from-blue-50 to-cyan-50' : ''
        }`}
        onClick={() => !isEditing && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isGlobal ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
          }`}>
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-slate-900">{prompt.name}</h4>
            {isGlobal && <p className="text-xs text-blue-600">Applied to all rooms</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prompt.is_active ? (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Active</span>
          ) : (
            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">Inactive</span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editedText}
                onChange={(e) => onTextChange(e.target.value)}
                className="w-full h-40 p-3 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{editedText.length} characters</span>
                <div className="flex gap-2">
                  <button
                    onClick={onCancel}
                    className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap mb-3 max-h-32 overflow-y-auto">
                {prompt.prompt_text}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit Prompt
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RoomStatusCard({
  roomNumber,
  isActive,
  summary,
}: {
  roomNumber: number;
  isActive: boolean;
  summary?: {
    content: string;
    key_topics: string[];
    sentiment_score: number;
  };
}) {
  const roomName = roomNumber === 0 ? 'Main Room' : `Breakout ${roomNumber}`;

  return (
    <div className={`rounded-xl border p-4 ${
      isActive ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
          <span className="font-medium text-slate-900">{roomName}</span>
        </div>
        {isActive && <Radio className="w-4 h-4 text-emerald-500" />}
      </div>

      {summary ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-600 line-clamp-2">{summary.content}</p>
          {summary.key_topics && summary.key_topics.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(summary.key_topics as string[]).slice(0, 3).map((topic, i) => (
                <span key={i} className="px-2 py-0.5 bg-white text-xs text-slate-600 rounded-full border border-slate-200">
                  {topic}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          {isActive ? 'Awaiting analysis...' : 'No active session'}
        </p>
      )}
    </div>
  );
}
