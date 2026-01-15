import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  Users,
  Activity,
  Zap,
  X,
  MessageSquare,
  Clock,
} from 'lucide-react';
import {
  useKnowledgeGraph,
  useInsights,
  useHeatmap,
  useAmbientStats,
  useRoomSummaries,
} from '../hooks/useAmbientData';
import { useDemoMode } from '../contexts/DemoModeContext';
import { AmbientSelectionProvider, useAmbientSelection } from '../contexts/AmbientSelectionContext';
import type { InsightEvent } from '../types/database';

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: '#3b82f6',
  Operations: '#10b981',
  Technology: '#8b5cf6',
  People: '#f59e0b',
  Finance: '#ef4444',
  General: '#6b7280',
};

export default function AmbientDisplay() {
  return (
    <AmbientSelectionProvider>
      <AmbientDisplayContent />
    </AmbientSelectionProvider>
  );
}

function AmbientDisplayContent() {
  const { isDemoMode } = useDemoMode();
  const { nodes, edges } = useKnowledgeGraph(120);
  const { insights } = useInsights(30);
  const { heatmapData, categories } = useHeatmap();
  const { stats } = useAmbientStats();
  const { summaries } = useRoomSummaries();
  const { selectedTopic, selectedRoom, clearAllFilters } = useAmbientSelection();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
      if (e.key === 'Escape') {
        clearAllFilters();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllFilters]);

  const hasActiveFilters = selectedTopic !== null || selectedRoom !== null;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      {!isDemoMode && stats.activeRooms === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md text-center shadow-2xl">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold mb-3">No Active Data</h2>
            <p className="text-slate-400 mb-6">
              Enable Demo Mode to see the Ambient Intelligence display with synthetic meeting data.
            </p>
            <p className="text-sm text-slate-500 mb-4">
              Look for the Demo Mode controls in the bottom-right corner or press <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs">D</kbd> on your keyboard.
            </p>
          </div>
        </div>
      )}

      <div className="relative h-full flex flex-col p-6">
        <Header stats={stats} currentTime={currentTime} isDemoMode={isDemoMode} />

        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-400/30 rounded-xl">
            <Target className="w-4 h-4 text-blue-400" />
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm text-blue-300">Active Filters:</span>
              {selectedTopic && (
                <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-sm text-white">
                  Topic: {selectedTopic.label}
                </span>
              )}
              {selectedRoom !== null && (
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-sm text-white">
                  Room: {selectedRoom === 0 ? 'Main' : `R${selectedRoom}`}
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 rounded-lg text-sm text-white transition-colors flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              Clear All
            </button>
          </div>
        )}

        <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 mt-6">
          <div className="col-span-5 flex flex-col gap-6 min-h-0">
            <div className="flex-1 min-h-0">
              <KnowledgeGraphPanel nodes={nodes} edges={edges} />
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6 min-h-0">
            <div className="flex-1 min-h-0">
              <HeatmapPanel data={heatmapData} categories={categories} />
            </div>
            <div className="h-48">
              <RoomStatusPanel stats={stats} summaries={summaries} />
            </div>
          </div>

          <div className="col-span-3 min-h-0">
            <InsightsFeed insights={insights} />
          </div>
        </div>

        <Footer stats={stats} />
      </div>
    </div>
  );
}

function Header({ stats, currentTime, isDemoMode }: { stats: ReturnType<typeof useAmbientStats>['stats']; currentTime: Date; isDemoMode: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
          <Brain className="w-7 h-7 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Ambient Intelligence</h1>
            {isDemoMode && (
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Demo Mode
              </span>
            )}
          </div>
          <p className="text-blue-300/80 text-sm">Company Transformation Event - Live Analysis</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <div className="flex items-center gap-6">
          <StatPill
            icon={Activity}
            label="Active Rooms"
            value={stats.activeRooms}
            color="emerald"
            pulse
          />
          <StatPill
            icon={Brain}
            label="Topics"
            value={stats.totalTopics}
            color="blue"
          />
          <StatPill
            icon={CheckCircle}
            label="Alignments"
            value={stats.alignments}
            color="cyan"
          />
          <StatPill
            icon={AlertTriangle}
            label="Misalignments"
            value={stats.misalignments}
            color="amber"
          />
        </div>

        <div className="text-right">
          <div className="text-3xl font-light text-white tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-sm text-slate-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'cyan' | 'amber';
  pulse?: boolean;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border ${colorClasses[color]}`}>
      <Icon className={`w-5 h-5 ${pulse ? 'animate-pulse' : ''}`} />
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function KnowledgeGraphPanel({ nodes, edges }: { nodes: { id: string; label: string; category: string | null; size: number; importance: number; roomMentions: Record<string, number> }[]; edges: { source: string; target: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const clickStartPos = useRef<{ x: number; y: number } | null>(null);
  const { selectedTopic, setSelectedTopic } = useAmbientSelection();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    nodes.forEach((node, i) => {
      if (!positionsRef.current.has(node.id)) {
        const angle = (i / nodes.length) * Math.PI * 2;
        const radius = 100 + Math.random() * 100;
        positionsRef.current.set(node.id, {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
        });
      }
    });

    positionsRef.current.forEach((pos, id) => {
      if (!nodes.find((n) => n.id === id)) {
        positionsRef.current.delete(id);
      }
    });

    positionsRef.current.forEach((pos, id) => {
      // Skip physics for dragged nodes
      if (id === draggedNodeId) return;

      const dx = centerX - pos.x;
      const dy = centerY - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 150) {
        pos.vx += (dx / dist) * 0.02;
        pos.vy += (dy / dist) * 0.02;
      }

      pos.vx *= 0.98;
      pos.vy *= 0.98;
      pos.x += pos.vx;
      pos.y += pos.vy;

      pos.x = Math.max(50, Math.min(width - 50, pos.x));
      pos.y = Math.max(50, Math.min(height - 50, pos.y));
    });

    ctx.clearRect(0, 0, width, height);

    edges.forEach((edge) => {
      const sourcePos = positionsRef.current.get(edge.source);
      const targetPos = positionsRef.current.get(edge.target);
      if (sourcePos && targetPos) {
        ctx.beginPath();
        ctx.moveTo(sourcePos.x, sourcePos.y);
        ctx.lineTo(targetPos.x, targetPos.y);
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    nodes.forEach((node) => {
      const pos = positionsRef.current.get(node.id);
      if (!pos) return;

      const size = Math.max(20, node.size);
      const color = CATEGORY_COLORS[node.category || 'General'] || CATEGORY_COLORS.General;
      const isHovered = node.id === hoveredNodeId;
      const isDragged = node.id === draggedNodeId;
      const isSelected = selectedTopic?.id === node.id;

      // Enhanced glow for hovered/dragged/selected nodes
      const glowSize = (isHovered || isDragged || isSelected) ? size * 2.5 : size * 1.5;
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize);
      if (isSelected) {
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.4, color + '80');
        gradient.addColorStop(1, 'transparent');
      } else {
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');
      }
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Add ring for hovered/dragged/selected nodes
      if (isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Add double ring for selected nodes
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2 + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2 + 9, 0, Math.PI * 2);
        ctx.strokeStyle = '#60a5fa40';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `${isSelected ? 'bold ' : ''}${Math.max(10, size / 3)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label.slice(0, 15), pos.x, pos.y + size / 2 + 12);
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [nodes, edges, draggedNodeId, hoveredNodeId, selectedTopic]);

  useEffect(() => {
    draw();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [draw]);

  const getNodeAtPosition = useCallback((x: number, y: number): string | null => {
    for (const node of nodes) {
      const pos = positionsRef.current.get(node.id);
      if (!pos) continue;

      const size = Math.max(20, node.size);
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Make hit area match the visual glow size for intuitive interaction
      if (distance <= size * 1.5) {
        return node.id;
      }
    }
    return null;
  }, [nodes]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / 2;
    const y = (e.clientY - rect.top) / 2;

    clickStartPos.current = { x, y };

    const nodeId = getNodeAtPosition(x, y);
    if (nodeId) {
      setDraggedNodeId(nodeId);
      isDraggingRef.current = false;
    }
  }, [getNodeAtPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / 2;
    const y = (e.clientY - rect.top) / 2;

    if (draggedNodeId && clickStartPos.current) {
      const dx = x - clickStartPos.current.x;
      const dy = y - clickStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 5) {
        isDraggingRef.current = true;
      }

      if (isDraggingRef.current) {
        const pos = positionsRef.current.get(draggedNodeId);
        if (pos) {
          pos.x = x;
          pos.y = y;
          pos.vx = 0;
          pos.vy = 0;
        }
      }
    } else {
      const nodeId = getNodeAtPosition(x, y);
      setHoveredNodeId(nodeId);
    }
  }, [draggedNodeId, getNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId) {
      if (!isDraggingRef.current) {
        const node = nodes.find(n => n.id === draggedNodeId);
        if (node) {
          if (selectedTopic?.id === node.id) {
            setSelectedTopic(null);
          } else {
            setSelectedTopic({
              id: node.id,
              label: node.label,
              category: node.category,
              roomMentions: node.roomMentions,
            });
          }
        }
      }
      setDraggedNodeId(null);
      isDraggingRef.current = false;
    }
    clickStartPos.current = null;
  }, [draggedNodeId, nodes, selectedTopic, setSelectedTopic]);

  const handleMouseLeave = useCallback(() => {
    setDraggedNodeId(null);
    setHoveredNodeId(null);
    isDraggingRef.current = false;
  }, []);

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Knowledge Network</h2>
        </div>
        <span className="text-sm text-slate-400">{nodes.length} topics connected</span>
      </div>
      <div ref={containerRef} className="relative h-[calc(100%-52px)]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ cursor: draggedNodeId ? 'grabbing' : (hoveredNodeId ? 'grab' : 'default') }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Brain className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Analyzing discussions...</p>
              <p className="text-sm text-slate-500">Topics will appear as they're detected</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HeatmapPanel({ data, categories }: { data: { room: number; category: string; intensity: number; topics: string[] }[]; categories: string[] }) {
  const rooms = ['Main', '1', '2', '3', '4', '5', '6', '7', '8'];
  const displayCategories = categories.length > 0 ? categories : ['Strategy', 'Operations', 'Technology', 'People', 'Finance'];
  const { selectedTopic, selectedRoom, setSelectedRoom } = useAmbientSelection();

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Target className="w-5 h-5 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">Topic Heat Map</h2>
      </div>

      <div className="p-4 h-[calc(100%-52px)] overflow-auto">
        <div className="grid gap-1" style={{ gridTemplateColumns: `80px repeat(${rooms.length}, 1fr)` }}>
          <div />
          {rooms.map((room) => (
            <div key={room} className="text-center text-xs font-medium text-slate-400 pb-2">
              {room === 'Main' ? 'Main' : `R${room}`}
            </div>
          ))}

          {displayCategories.map((category) => (
            <>
              <div key={`label-${category}`} className="text-xs font-medium text-slate-400 flex items-center pr-2 truncate">
                {category}
              </div>
              {rooms.map((room, roomIdx) => {
                const roomNumber = room === 'Main' ? 0 : parseInt(room);
                const cell = data.find((d) => d.room === roomNumber && d.category === category);
                const intensity = cell?.intensity || 0;
                const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;

                const hasSelectedTopic = selectedTopic && cell?.topics.includes(selectedTopic.label);
                const isSelectedRoom = selectedRoom === roomNumber;
                const isRelevant = hasSelectedTopic || isSelectedRoom || (selectedTopic && Object.keys(selectedTopic.roomMentions).includes(roomNumber.toString()) && category === selectedTopic.category);

                return (
                  <div
                    key={`${category}-${room}`}
                    className={`aspect-square rounded-lg relative group cursor-pointer transition-all hover:scale-105 ${
                      isRelevant ? 'ring-2 ring-blue-400 ring-offset-1 ring-offset-slate-900 scale-105 animate-pulse' : ''
                    }`}
                    style={{
                      backgroundColor: intensity > 0 ? `${color}${Math.round(intensity * 80 + 20).toString(16).padStart(2, '0')}` : 'rgba(100, 116, 139, 0.1)',
                      opacity: selectedTopic && !isRelevant ? 0.3 : 1,
                    }}
                    onClick={() => setSelectedRoom(selectedRoom === roomNumber ? null : roomNumber)}
                  >
                    {hasSelectedTopic && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900 animate-pulse" />
                    )}
                    {cell && cell.topics.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap max-w-xs">
                        <div className="text-xs text-white font-medium">{cell.topics.slice(0, 3).join(', ')}</div>
                        {hasSelectedTopic && (
                          <div className="text-xs text-blue-300 mt-1">✓ Contains: {selectedTopic.label}</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-slate-700/50">
          <span className="text-xs text-slate-500">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded bg-slate-700/50" />
            <span className="text-xs text-slate-500">Low</span>
          </div>
          <div className="w-16 h-3 rounded bg-gradient-to-r from-blue-500/30 to-blue-500" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-500">High</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoomStatusPanel({ stats, summaries }: { stats: ReturnType<typeof useAmbientStats>['stats']; summaries: ReturnType<typeof useRoomSummaries>['summaries'] }) {
  const { isDemoMode } = useDemoMode();
  const allRooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const { selectedRoom, setSelectedRoom, selectedTopic } = useAmbientSelection();

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Room Activity</h2>
        <span className="text-xs text-slate-400">({stats.activeRooms} active)</span>
      </div>

      <div className="p-3 grid grid-cols-9 gap-2">
        {allRooms.map((roomNumber) => {
          const isActive = roomNumber === 0 ? stats.roomStatus.main : stats.roomStatus.breakout.includes(roomNumber);
          const summary = summaries.find((s) => s.room_number === roomNumber);
          const isSelected = selectedRoom === roomNumber;
          const hasSelectedTopic = selectedTopic && summary?.key_topics &&
            (summary.key_topics as string[]).includes(selectedTopic.label);

          const participantCount = isDemoMode ? Math.floor(Math.random() * 8) + 4 : 0;
          const sentiment = summary?.sentiment_score || 0.5;
          const sentimentColor = sentiment > 0.6 ? 'emerald' : sentiment < 0.4 ? 'amber' : 'blue';

          return (
            <div
              key={roomNumber}
              onClick={() => setSelectedRoom(isSelected ? null : roomNumber)}
              className={`rounded-xl p-2 cursor-pointer transition-all hover:scale-105 relative ${
                isSelected
                  ? 'bg-blue-500/30 border-2 border-blue-400 ring-2 ring-blue-400/50'
                  : isActive
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-slate-800/50 border border-slate-700/30 opacity-50'
              }`}
            >
              {hasSelectedTopic && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full border-2 border-slate-900 animate-pulse z-10" />
              )}

              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  <span className="text-sm font-bold text-white">
                    {roomNumber === 0 ? 'M' : roomNumber}
                  </span>
                </div>

                {isActive && (
                  <>
                    <div className="flex items-center gap-0.5 text-xs text-slate-400">
                      <Users className="w-3 h-3" />
                      <span>{participantCount}</span>
                    </div>

                    {summary && (
                      <>
                        <div className={`w-full h-1 rounded-full bg-${sentimentColor}-500/30`}>
                          <div
                            className={`h-full rounded-full bg-${sentimentColor}-400 transition-all`}
                            style={{ width: `${sentiment * 100}%` }}
                          />
                        </div>

                        <div className="text-[10px] text-slate-400 truncate w-full text-center leading-tight">
                          {(summary.key_topics as string[])?.[0]?.slice(0, 12) || ''}
                        </div>
                      </>
                    )}
                  </>
                )}

                {!isActive && (
                  <span className="text-[10px] text-slate-500">Idle</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightsFeed({ insights }: { insights: InsightEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);
  const { selectedTopic, selectedRoom } = useAmbientSelection();
  const [autoScroll, setAutoScroll] = useState(true);

  const filteredInsights = insights.filter((insight) => {
    if (selectedTopic && !insight.related_topics.includes(selectedTopic.label)) {
      return false;
    }
    if (selectedRoom !== null && !insight.involved_rooms.includes(selectedRoom)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed || !autoScroll) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const scroll = () => {
      scrollPosition += scrollSpeed;
      if (scrollPosition >= feed.scrollHeight - feed.clientHeight) {
        scrollPosition = 0;
      }
      feed.scrollTop = scrollPosition;
    };

    const interval = setInterval(scroll, 50);
    return () => clearInterval(interval);
  }, [filteredInsights, autoScroll]);

  const handleScroll = () => {
    setAutoScroll(false);
    setTimeout(() => setAutoScroll(true), 5000);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alignment': return CheckCircle;
      case 'misalignment': return AlertTriangle;
      case 'gap': return Target;
      case 'highlight': return Lightbulb;
      default: return TrendingUp;
    }
  };

  const getInsightColors = (type: string, severity: string) => {
    if (type === 'misalignment' || severity === 'alert') {
      return 'border-amber-500/30 bg-amber-500/10';
    }
    if (type === 'alignment') {
      return 'border-emerald-500/30 bg-emerald-500/10';
    }
    if (type === 'gap') {
      return 'border-blue-500/30 bg-blue-500/10';
    }
    return 'border-slate-600/30 bg-slate-800/50';
  };

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Live Insights</h2>
        </div>
        {(selectedTopic || selectedRoom !== null) && (
          <span className="px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-xs text-blue-300">
            {filteredInsights.length} of {insights.length}
          </span>
        )}
      </div>

      <div ref={feedRef} className="flex-1 overflow-hidden p-4 space-y-3" onWheel={handleScroll}>
        {filteredInsights.length === 0 && insights.length > 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Target className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No insights match current filters</p>
              <p className="text-sm text-slate-500">Try selecting a different topic or room</p>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Generating insights...</p>
              <p className="text-sm text-slate-500">Cross-room patterns will appear here</p>
            </div>
          </div>
        ) : (
          filteredInsights.map((insight) => {
            const Icon = getInsightIcon(insight.insight_type);
            const hasMatchingTopic = selectedTopic && insight.related_topics.includes(selectedTopic.label);
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border ${getInsightColors(insight.insight_type, insight.severity)} transition-all ${
                  hasMatchingTopic ? 'ring-2 ring-blue-400/50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    insight.insight_type === 'misalignment' ? 'bg-amber-500/20 text-amber-400' :
                    insight.insight_type === 'alignment' ? 'bg-emerald-500/20 text-emerald-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm leading-tight mb-1">
                      {insight.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      {insight.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {insight.involved_rooms && insight.involved_rooms.length > 0 && (
                        <div className="flex items-center gap-1">
                          {insight.involved_rooms.map((room) => (
                            <span key={room} className={`px-1.5 py-0.5 text-xs rounded ${
                              selectedRoom === room
                                ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-300'
                                : 'bg-slate-700/50 text-slate-300'
                            }`}>
                              {room === 0 ? 'Main' : `R${room}`}
                            </span>
                          ))}
                        </div>
                      )}
                      {hasMatchingTopic && (
                        <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 text-xs text-blue-300 rounded flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {selectedTopic.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Footer({ stats }: { stats: ReturnType<typeof useAmbientStats>['stats'] }) {
  return (
    <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Analysis Active</span>
        </div>
        <span>Click topics to filter • Click rooms to focus</span>
        <span>Press F for fullscreen • ESC to clear filters</span>
      </div>
      <div className="flex items-center gap-4">
        {Object.entries(CATEGORY_COLORS).slice(0, 5).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
