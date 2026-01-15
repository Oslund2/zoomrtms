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
} from 'lucide-react';
import {
  useKnowledgeGraph,
  useInsights,
  useHeatmap,
  useAmbientStats,
  useRoomSummaries,
} from '../hooks/useAmbientData';
import { useDemoMode } from '../contexts/DemoModeContext';
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
  const { isDemoMode } = useDemoMode();
  const { nodes, edges } = useKnowledgeGraph(120);
  const { insights } = useInsights(30);
  const { heatmapData, categories } = useHeatmap();
  const { stats } = useAmbientStats();
  const { summaries } = useRoomSummaries();

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

function KnowledgeGraphPanel({ nodes, edges }: { nodes: { id: string; label: string; category: string | null; size: number; importance: number }[]; edges: { source: string; target: string }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const positionsRef = useRef<Map<string, { x: number; y: number; vx: number; vy: number }>>(new Map());
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);

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

      // Enhanced glow for hovered/dragged nodes
      const glowSize = (isHovered || isDragged) ? size * 2 : size * 1.5;
      const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, glowSize);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Add ring for hovered/dragged nodes
      if (isHovered || isDragged) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size / 2 + 3, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = `${Math.max(10, size / 3)}px Inter, system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label.slice(0, 15), pos.x, pos.y + size / 2 + 12);
    });

    animationRef.current = requestAnimationFrame(draw);
  }, [nodes, edges, draggedNodeId, hoveredNodeId]);

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

    const nodeId = getNodeAtPosition(x, y);
    if (nodeId) {
      setDraggedNodeId(nodeId);
      isDraggingRef.current = true;
    }
  }, [getNodeAtPosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / 2;
    const y = (e.clientY - rect.top) / 2;

    if (isDraggingRef.current && draggedNodeId) {
      const pos = positionsRef.current.get(draggedNodeId);
      if (pos) {
        pos.x = x;
        pos.y = y;
        pos.vx = 0;
        pos.vy = 0;
      }
    } else {
      const nodeId = getNodeAtPosition(x, y);
      setHoveredNodeId(nodeId);
    }
  }, [draggedNodeId, getNodeAtPosition]);

  const handleMouseUp = useCallback(() => {
    if (draggedNodeId) {
      setDraggedNodeId(null);
      isDraggingRef.current = false;
    }
  }, [draggedNodeId]);

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

                return (
                  <div
                    key={`${category}-${room}`}
                    className="aspect-square rounded-lg relative group cursor-pointer transition-transform hover:scale-105"
                    style={{
                      backgroundColor: intensity > 0 ? `${color}${Math.round(intensity * 80 + 20).toString(16).padStart(2, '0')}` : 'rgba(100, 116, 139, 0.1)',
                    }}
                  >
                    {cell && cell.topics.length > 0 && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <div className="text-xs text-white font-medium">{cell.topics.slice(0, 3).join(', ')}</div>
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
  const allRooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="h-full bg-slate-900/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Users className="w-5 h-5 text-emerald-400" />
        <h2 className="text-lg font-semibold text-white">Room Activity</h2>
      </div>

      <div className="p-4 grid grid-cols-9 gap-2">
        {allRooms.map((roomNumber) => {
          const isActive = roomNumber === 0 ? stats.roomStatus.main : stats.roomStatus.breakout.includes(roomNumber);
          const summary = summaries.find((s) => s.room_number === roomNumber);

          return (
            <div
              key={roomNumber}
              className={`rounded-xl p-3 text-center transition-all ${
                isActive
                  ? 'bg-emerald-500/20 border border-emerald-500/30'
                  : 'bg-slate-800/50 border border-slate-700/30'
              }`}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                <span className="text-sm font-medium text-white">
                  {roomNumber === 0 ? 'M' : roomNumber}
                </span>
              </div>
              {summary && (
                <div className="text-xs text-slate-400 truncate">
                  {(summary.key_topics as string[])?.[0] || ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InsightsFeed({ insights }: { insights: InsightEvent[] }) {
  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

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
  }, [insights]);

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
      <div className="px-5 py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h2 className="text-lg font-semibold text-white">Live Insights</h2>
      </div>

      <div ref={feedRef} className="flex-1 overflow-hidden p-4 space-y-3">
        {insights.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">Generating insights...</p>
              <p className="text-sm text-slate-500">Cross-room patterns will appear here</p>
            </div>
          </div>
        ) : (
          insights.map((insight) => {
            const Icon = getInsightIcon(insight.insight_type);
            return (
              <div
                key={insight.id}
                className={`p-4 rounded-xl border ${getInsightColors(insight.insight_type, insight.severity)} transition-all`}
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
                    {insight.involved_rooms && insight.involved_rooms.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {insight.involved_rooms.map((room) => (
                          <span key={room} className="px-1.5 py-0.5 bg-slate-700/50 text-xs text-slate-300 rounded">
                            {room === 0 ? 'Main' : `R${room}`}
                          </span>
                        ))}
                      </div>
                    )}
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
        <span>Press F for fullscreen</span>
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
