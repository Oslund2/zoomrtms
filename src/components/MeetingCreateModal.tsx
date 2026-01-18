import { useState, useEffect, useRef } from 'react';
import { X, Mic, Loader2, CheckCircle2, Users, Pencil, Upload, ImageIcon, Trash2, Sparkles, AlertCircle, Check, Wand2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Meeting } from '../types/database';
import NamingGuide from './NamingGuide';
import {
  validateMeetingName,
  generateMeetingName,
  applyTemplate,
  getQuickPresets,
  type NamingTemplate,
  type NamingValidationResult,
} from '../lib/namingUtils';

interface MeetingCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meeting: { id: string; meeting_uuid: string; topic: string }) => void;
  editMeeting?: Meeting | null;
}

export default function MeetingCreateModal({ isOpen, onClose, onSuccess, editMeeting }: MeetingCreateModalProps) {
  const [topic, setTopic] = useState('');
  const [hostName, setHostName] = useState('');
  const [roomType, setRoomType] = useState<'main' | 'breakout'>('main');
  const [roomNumber, setRoomNumber] = useState<number>(1);
  const [status, setStatus] = useState<'active' | 'ended'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [existingIconUrl, setExistingIconUrl] = useState<string | null>(null);
  const [removeIcon, setRemoveIcon] = useState(false);
  const [occupiedRooms, setOccupiedRooms] = useState<Set<number>>(new Set());
  const [templates, setTemplates] = useState<NamingTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [autoNaming, setAutoNaming] = useState(true);
  const [validation, setValidation] = useState<NamingValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!editMeeting;
  const quickPresets = getQuickPresets();

  useEffect(() => {
    if (editMeeting) {
      setTopic(editMeeting.topic || '');
      setHostName(editMeeting.host_name || '');
      setRoomType(editMeeting.room_type as 'main' | 'breakout' || 'main');
      setRoomNumber(editMeeting.room_number || 1);
      setStatus(editMeeting.status as 'active' | 'ended' || 'active');
      setExistingIconUrl(editMeeting.icon_url || null);
      setRemoveIcon(false);
    } else {
      setTopic('');
      setHostName('');
      setRoomType('main');
      setRoomNumber(1);
      setStatus('active');
      setExistingIconUrl(null);
      setRemoveIcon(false);
    }
    setIconFile(null);
    setIconPreview(null);
  }, [editMeeting, isOpen]);

  useEffect(() => {
    const fetchData = async () => {
      if (!isOpen) return;

      const { data: roomsData, error: roomsError } = await supabase
        .from('meetings')
        .select('room_number')
        .eq('room_type', 'breakout')
        .eq('status', 'active')
        .not('room_number', 'is', null);

      if (!roomsError && roomsData) {
        const occupied = new Set<number>();
        roomsData.forEach((meeting) => {
          if (meeting.room_number !== null) {
            if (!editMeeting || meeting.room_number !== editMeeting.room_number) {
              occupied.add(meeting.room_number);
            }
          }
        });
        setOccupiedRooms(occupied);
      }

      const { data: templatesData, error: templatesError } = await supabase
        .from('naming_templates')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!templatesError && templatesData) {
        setTemplates(templatesData);
      }
    };

    fetchData();
  }, [isOpen, editMeeting]);

  useEffect(() => {
    const result = validateMeetingName(topic, roomType, roomType === 'breakout' ? roomNumber : undefined);
    setValidation(result);
  }, [topic, roomType, roomNumber]);

  useEffect(() => {
    if (!isEditMode && autoNaming && roomType === 'breakout') {
      const currentBase = topic.replace(/\s*-?\s*Breakout\s+Room\s+\d+/gi, '').trim();
      if (!currentBase || currentBase === topic) {
        const newName = generateMeetingName('All Participants', 'breakout', roomNumber);
        setTopic(newName);
      } else {
        const newName = generateMeetingName(currentBase, 'breakout', roomNumber);
        setTopic(newName);
      }
    }
  }, [roomNumber, roomType]);

  const handlePresetClick = (presetName: string) => {
    if (roomType === 'breakout') {
      setTopic(`${presetName} - Breakout Room ${roomNumber}`);
    } else {
      setTopic(presetName);
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const newName = applyTemplate(template.template_pattern, roomNumber);
      setTopic(newName);
    }
  };

  const handleAutoFix = () => {
    if (validation && !validation.isValid) {
      const newName = generateMeetingName(topic, roomType, roomType === 'breakout' ? roomNumber : undefined);
      setTopic(newName);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be smaller than 2MB');
        return;
      }
      setIconFile(file);
      setRemoveIcon(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setIconPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setRemoveIcon(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadIcon = async (meetingId: string): Promise<string | null> => {
    if (!iconFile) return null;

    const fileExt = iconFile.name.split('.').pop();
    const fileName = `${meetingId}-${Date.now()}.${fileExt}`;
    const filePath = `room-icons/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('meeting-assets')
      .upload(filePath, iconFile, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('meeting-assets')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && editMeeting) {
        let newIconUrl: string | null | undefined = undefined;

        if (iconFile) {
          newIconUrl = await uploadIcon(editMeeting.id);
        } else if (removeIcon) {
          newIconUrl = null;
        }

        const { data, error: updateError } = await supabase
          .from('meetings')
          .update({
            topic: topic.trim() || 'Untitled Meeting',
            host_name: hostName.trim() || 'Manual Entry',
            room_type: roomType,
            room_number: roomType === 'breakout' ? roomNumber : null,
            status,
            ended_at: status === 'ended' ? new Date().toISOString() : null,
            ...(newIconUrl !== undefined && { icon_url: newIconUrl }),
          })
          .eq('id', editMeeting.id)
          .select()
          .single();

        if (updateError) throw updateError;

        onSuccess({
          id: data.id,
          meeting_uuid: data.meeting_uuid,
          topic: data.topic || 'Untitled Meeting',
        });
      } else {
        const meetingUuid = crypto.randomUUID();
        const meetingId = crypto.randomUUID();

        let iconUrl: string | null = null;
        if (iconFile) {
          iconUrl = await uploadIcon(meetingId);
        }

        const { data, error: insertError } = await supabase
          .from('meetings')
          .insert({
            id: meetingId,
            meeting_uuid: meetingUuid,
            topic: topic.trim() || 'Untitled Meeting',
            host_name: hostName.trim() || 'Manual Entry',
            status: 'active',
            room_type: roomType,
            room_number: roomType === 'breakout' ? roomNumber : null,
            started_at: new Date().toISOString(),
            icon_url: iconUrl,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        onSuccess({
          id: data.id,
          meeting_uuid: data.meeting_uuid,
          topic: data.topic || 'Untitled Meeting',
        });
      }

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} meeting`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTopic('');
    setHostName('');
    setRoomType('main');
    setRoomNumber(1);
    setStatus('active');
    setError(null);
    setIconFile(null);
    setIconPreview(null);
    setExistingIconUrl(null);
    setRemoveIcon(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isEditMode ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              {isEditMode ? (
                <Pencil className="w-5 h-5 text-amber-600" />
              ) : (
                <Mic className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditMode ? 'Edit Meeting' : 'Create Meeting'}
              </h2>
              <p className="text-sm text-slate-500">
                {isEditMode ? 'Update meeting details' : 'Add a new meeting for testing or manual entry'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {!isEditMode && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-900">Quick Presets</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoNaming(!autoNaming)}
                  className={`text-xs px-2 py-1 rounded ${
                    autoNaming ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  Auto-naming {autoNaming ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handlePresetClick(preset.name)}
                    className="px-3 py-1.5 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-medium text-slate-700 transition-colors"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-700">
                Meeting Topic
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              {validation && !validation.isValid && (
                <button
                  type="button"
                  onClick={handleAutoFix}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Wand2 className="w-3 h-3" />
                  Auto-fix
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Team Standup, Project Review"
                className={`w-full px-4 py-3 pr-10 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow ${
                  validation?.isValid
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : validation?.issues.length
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-slate-200'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validation?.isValid ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : validation?.issues.length ? (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                ) : null}
              </div>
            </div>
            {validation && !validation.isValid && validation.issues.length > 0 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 font-medium mb-1">Naming Issues:</p>
                {validation.issues.map((issue, idx) => (
                  <p key={idx} className="text-xs text-amber-700">• {issue}</p>
                ))}
                {validation.suggestions.length > 0 && (
                  <p className="text-xs text-amber-600 mt-1 italic">{validation.suggestions[0]}</p>
                )}
              </div>
            )}
            {validation?.isValid && roomType === 'breakout' && (
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-700">
                <Check className="w-3 h-3" />
                <span>Zoom will detect: Breakout Room {validation.detectedRoomNumber}</span>
              </div>
            )}
          </div>

          {!isEditMode && templates.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Use Template
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              >
                <option value="">Select a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.description ? `- ${template.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isEditMode && <NamingGuide roomType={roomType} />}

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
              Room Icon
              <span className="text-slate-400 font-normal ml-1">(optional)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="hidden"
              id="icon-upload"
            />
            <div className="flex items-center gap-4">
              {(iconPreview || (existingIconUrl && !removeIcon)) ? (
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-slate-200">
                    <img
                      src={iconPreview || existingIconUrl || ''}
                      alt="Icon preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center border-2 border-dashed border-slate-300">
                  <ImageIcon className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <label
                htmlFor="icon-upload"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-600">
                  {iconPreview || (existingIconUrl && !removeIcon) ? 'Change image' : 'Upload image'}
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-400">PNG, JPG or GIF up to 2MB</p>
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
                  <Mic className="w-5 h-5" />
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
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => {
                  const isOccupied = occupiedRooms.has(num);
                  return (
                    <option
                      key={num}
                      value={num}
                      className={isOccupied ? 'text-slate-400' : ''}
                    >
                      Breakout Room {num}{isOccupied ? ' (In Use)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    status === 'active'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('ended')}
                  className={`px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                    status === 'ended'
                      ? 'border-slate-500 bg-slate-100 text-slate-700'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                  }`}
                >
                  Ended
                </button>
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors ${
                isEditMode
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isEditMode ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? <Pencil className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                  {isEditMode ? 'Save Changes' : 'Create Meeting'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
