import { Link } from 'react-router-dom';
import { Mic, Users, Radio, Clock, Pencil, Trash2, AudioWaveform } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Meeting } from '../types/database';

interface RoomGridProps {
  meetings: Meeting[];
  participantCounts: Record<string, number>;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (meeting: Meeting) => void;
}

export default function RoomGrid({ meetings, participantCounts, onEdit, onDelete }: RoomGridProps) {
  const mainRoom = meetings.find((m) => m.room_type === 'main');
  const breakoutRooms: (Meeting | null)[] = Array.from({ length: 8 }, (_, i) => {
    return meetings.find((m) => m.room_type === 'breakout' && m.room_number === i + 1) || null;
  });

  return (
    <div className="space-y-6">
      {mainRoom && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
            Main Conference Room
          </h3>
          <RoomCard
            meeting={mainRoom}
            participantCount={participantCounts[mainRoom.id] || 0}
            isMain
            onEdit={onEdit ? () => onEdit(mainRoom) : undefined}
            onDelete={onDelete ? () => onDelete(mainRoom) : undefined}
          />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
          Breakout Rooms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {breakoutRooms.map((room, index) => (
            <RoomSlot
              key={index}
              room={room}
              roomNumber={index + 1}
              participantCount={room ? participantCounts[room.id] || 0 : 0}
              onEdit={room && onEdit ? () => onEdit(room) : undefined}
              onDelete={room && onDelete ? () => onDelete(room) : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RoomCard({
  meeting,
  participantCount,
  isMain,
  onEdit,
  onDelete,
}: {
  meeting: Meeting;
  participantCount: number;
  isMain?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 hover:border-blue-400 p-6 transition-all hover:shadow-lg group relative">
      {(onEdit || onDelete) && (
        <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-amber-600 shadow-sm border border-slate-200"
              title="Edit meeting"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 bg-white hover:bg-red-50 rounded-lg transition-colors text-slate-500 hover:text-red-600 shadow-sm border border-slate-200"
              title="Delete meeting"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <Link to={`/meeting/${meeting.id}`} className="block">
        <div className="flex items-start gap-4">
          {meeting.icon_url ? (
            <div
              className={`${
                isMain ? 'w-16 h-16' : 'w-14 h-14'
              } rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform overflow-hidden`}
            >
              <img
                src={meeting.icon_url}
                alt="Room icon"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.classList.add('bg-gradient-to-br', 'from-blue-500', 'to-cyan-400', 'flex', 'items-center', 'justify-center');
                }}
              />
            </div>
          ) : (
            <div
              className={`${
                isMain ? 'w-16 h-16' : 'w-14 h-14'
              } bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
            >
              <Mic className={`${isMain ? 'w-8 h-8' : 'w-7 h-7'} text-white`} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className={`${isMain ? 'text-lg' : 'text-base'} font-bold text-slate-900 truncate`}>
                {meeting.topic || 'Untitled Meeting'}
              </h3>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                <Radio className="w-3 h-3 mr-1 animate-pulse" />
                Live
              </span>
            </div>

            <p className="text-sm text-slate-500 mb-3">
              Hosted by {meeting.host_name || 'Unknown'}
            </p>

            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <span className="font-medium">{participantCount}</span>
                <span className="text-slate-400">participants</span>
              </span>
              {meeting.started_at && (
                <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(meeting.started_at), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

function RoomSlot({
  room,
  roomNumber,
  participantCount,
  onEdit,
  onDelete,
}: {
  room: Meeting | null;
  roomNumber: number;
  participantCount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!room) {
    return (
      <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center min-h-[140px]">
        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center mb-2">
          <AudioWaveform className="w-5 h-5 text-slate-400" />
        </div>
        <span className="text-sm font-medium text-slate-400">Breakout {roomNumber}</span>
        <span className="text-xs text-slate-400 mt-1">Waiting...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-blue-400 p-4 transition-all hover:shadow-md group relative">
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 bg-white hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-amber-600 shadow-sm border border-slate-200"
              title="Edit"
            >
              <Pencil className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 bg-white hover:bg-red-50 rounded-md transition-colors text-slate-500 hover:text-red-600 shadow-sm border border-slate-200"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <Link to={`/meeting/${room.id}`} className="block">
        <div className="flex items-center gap-3 mb-3">
          {room.icon_url ? (
            <div className="w-10 h-10 rounded-lg group-hover:scale-110 transition-transform overflow-hidden">
              <img
                src={room.icon_url}
                alt="Room icon"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Mic className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                Breakout {roomNumber}
              </h4>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-slate-500 truncate">{room.topic || 'Active'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 text-slate-600">
            <Users className="w-3.5 h-3.5" />
            {participantCount}
          </span>
          {room.started_at && (
            <span className="text-slate-400">
              {formatDistanceToNow(new Date(room.started_at), { addSuffix: false })}
            </span>
          )}
        </div>
      </Link>
    </div>
  );
}
