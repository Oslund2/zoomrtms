import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft,
} from 'lucide-react';
import {
  useKnowledgeGraph,
  useInsights,
  useHeatmap,
  useAmbientStats,
  useRoomSummaries,
  useAmbientTranscripts,
} from '../hooks/useAmbientData';
import { useDemoMode } from '../contexts/DemoModeContext';
import { AmbientSelectionProvider, useAmbientSelection } from '../contexts/AmbientSelectionContext';
import { TopicDetailPanel } from '../components/TopicDetailPanel';
import { InsightDetailPanel } from '../components/InsightDetailPanel';
import { TranscriptQuotesPanel } from '../components/TranscriptQuotesPanel';
import { TranscriptDetailPanel } from '../components/TranscriptDetailPanel';
import type { InsightEvent } from '../types/database';

const CATEGORY_COLORS: Record<string, string> = {
  News: '#3b82f6',
  Finance: '#ef4444',
  HR: '#f59e0b',
  Communications: '#06b6d4',
  AI: '#8b5cf6',
  Marketing: '#ec4899',
  Operations: '#10b981',
  Technology: '#6366f1',
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
  const { transcripts } = useAmbientTranscripts(50);
  const { selectedTopic, selectedRoom, selectedTranscript, statFilter, setSelectedTranscript, clearAllFilters } = useAmbientSelection();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileTab, setMobileTab] = useState<'graph' | 'heatmap' | 'insights'>('insights');
  const [selectedInsight, setSelectedInsight] = useState<InsightEvent | null>(null);

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
        if (selectedInsight) {
          setSelectedInsight(null);
        } else {
          clearAllFilters();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearAllFilters, selectedInsight]);

  const hasActiveFilters = selectedTopic !== null || selectedRoom !== null;

  return (
    <div className="fixed inset-0 bg-slate-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      {!isDemoMode && stats.activeRooms === 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-md text-center shadow-2xl">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3">No Active Data</h2>
            <p className="text-slate-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Enable Demo Mode to see the Ambient Intelligence display with synthetic meeting data.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Look for the Demo Mode controls in the bottom-right corner.
            </p>
          </div>
        </div>
      )}

      <div className="relative h-full flex flex-col p-3 sm:p-4 lg:p-6 pb-safe">
        <Header stats={stats} currentTime={currentTime} isDemoMode={isDemoMode} />

        {hasActiveFilters && (
          <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-500/10 border border-blue-400/30 rounded-lg sm:rounded-xl">
            <Target className="w-4 h-4 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
            <div className="flex items-center gap-2 sm:gap-2 flex-1 overflow-x-auto scrollbar-thin">
              {selectedTopic && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1 bg-blue-500/20 border border-blue-400/30 rounded-lg text-xs sm:text-sm text-white whitespace-nowrap">
                  {selectedTopic.label}
                </span>
              )}
              {selectedRoom !== null && (
                <span className="px-2.5 sm:px-3 py-1 sm:py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-lg text-xs sm:text-sm text-white whitespace-nowrap">
                  {selectedRoom === 0 ? 'Main' : `R${selectedRoom}`}
                </span>
              )}
            </div>
            <button
              onClick={clearAllFilters}
              className="p-2 sm:px-3 sm:py-1.5 bg-slate-700/50 active:bg-slate-600/70 sm:hover:bg-slate-600/50 border border-slate-600 rounded-lg text-xs sm:text-sm text-white transition-colors flex items-center gap-1 sm:gap-2 flex-shrink-0 touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        )}

        <div className="lg:hidden flex items-center gap-1 mt-3 bg-slate-800/50 p-1 rounded-xl">
          {[
            { id: 'insights', label: 'Insights', icon: Lightbulb },
            { id: 'graph', label: 'Network', icon: Zap },
            { id: 'heatmap', label: 'Heatmap', icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id as typeof mobileTab)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                mobileTab === tab.id
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 active:text-white sm:hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="hidden lg:grid flex-1 grid-cols-12 gap-6 min-h-0 mt-6">
          <div className="col-span-5 flex flex-col gap-6 min-h-0">
            <div className="flex-1 min-h-0">
              <KnowledgeGraphPanel nodes={nodes} edges={edges} />
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6 min-h-0">
            <div style={{ height: '35%' }} className="min-h-0">
              <HeatmapPanel data={heatmapData} categories={categories} />
            </div>
            <div style={{ height: '30%' }} className="min-h-0">
              <TranscriptQuotesPanel transcripts={transcripts} />
            </div>
            <div className="flex-1 min-h-0">
              <RoomStatusPanel stats={stats} summaries={summaries} />
            </div>
          </div>

          <div className="col-span-3 min-h-0">
            <InsightsFeed insights={insights} onInsightClick={setSelectedInsight} />
          </div>
        </div>

        <div className="lg:hidden flex-1 min-h-0 mt-3 flex flex-col">
          <div className="mb-3">
            <MobileRoomStatusBar stats={stats} summaries={summaries} />
          </div>

          <div className="flex-1 min-h-0">
            {mobileTab === 'insights' && <InsightsFeed insights={insights} onInsightClick={setSelectedInsight} />}
            {mobileTab === 'graph' && <KnowledgeGraphPanel nodes={nodes} edges={edges} />}
            {mobileTab === 'heatmap' && <HeatmapPanel data={heatmapData} categories={categories} />}
          </div>
        </div>

        <Footer stats={stats} />
      </div>

      {selectedTopic && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={clearAllFilters}
          />
          <TopicDetailPanel
            topic={selectedTopic}
            insights={insights}
            nodes={nodes}
            edges={edges}
            onClose={clearAllFilters}
          />
        </>
      )}

      {selectedInsight && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={() => setSelectedInsight(null)}
          />
          <InsightDetailPanel
            insight={selectedInsight}
            onClose={() => setSelectedInsight(null)}
          />
        </>
      )}

      {selectedTranscript && (
        <TranscriptDetailPanel
          transcript={selectedTranscript}
          onClose={() => setSelectedTranscript(null)}
        />
      )}

      {statFilter && (
        <>
          <div
            className="fixed inset-0 bg-black/50 sm:bg-black/40 backdrop-blur-sm z-40 touch-none"
            onClick={clearAllFilters}
          />
          <StatDetailPanel
            filterType={statFilter}
            nodes={nodes}
            insights={insights}
            summaries={summaries}
            stats={stats}
            onClose={clearAllFilters}
          />
        </>
      )}
    </div>
  );
}

function Header({ stats, currentTime, isDemoMode }: { stats: ReturnType<typeof useAmbientStats>['stats']; currentTime: Date; isDemoMode: boolean }) {
  const navigate = useNavigate();
  const { statFilter, setStatFilter } = useAmbientSelection();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate('/')}
          className="w-9 h-9 sm:w-12 sm:h-12 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50 hover:border-slate-500 rounded-lg sm:rounded-xl flex items-center justify-center transition-all hover:scale-105 group flex-shrink-0"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-white transition-colors" />
        </button>
        <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
          <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight truncate">Ambient Intelligence</h1>
            {isDemoMode && (
              <span className="hidden sm:inline px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Demo
              </span>
            )}
          </div>
          <p className="text-blue-300/80 text-xs sm:text-sm truncate">
            {isDemoMode && <span className="sm:hidden text-blue-300">[Demo] </span>}
            <span className="hidden sm:inline">Company Transformation Event - </span>Live Analysis
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-8">
        <div className="flex items-center gap-2 sm:gap-6 overflow-x-auto pb-1 sm:pb-0 -mx-3 px-3 sm:mx-0 sm:px-0 flex-1 sm:flex-none">
          <MiniStatPill
            icon={Activity}
            label="Rooms"
            value={stats.activeRooms}
            color="emerald"
            pulse
            onClick={() => setStatFilter(statFilter === 'rooms' ? null : 'rooms')}
            isActive={statFilter === 'rooms'}
          />
          <MiniStatPill
            icon={Brain}
            label="Topics"
            value={stats.totalTopics}
            color="blue"
            onClick={() => setStatFilter(statFilter === 'topics' ? null : 'topics')}
            isActive={statFilter === 'topics'}
          />
          <MiniStatPill
            icon={CheckCircle}
            label="Aligned"
            value={stats.alignments}
            color="cyan"
            onClick={() => setStatFilter(statFilter === 'aligned' ? null : 'aligned')}
            isActive={statFilter === 'aligned'}
          />
          <MiniStatPill
            icon={AlertTriangle}
            label="Issues"
            value={stats.misalignments}
            color="amber"
            onClick={() => setStatFilter(statFilter === 'issues' ? null : 'issues')}
            isActive={statFilter === 'issues'}
          />
        </div>

        <div className="text-right flex-shrink-0 hidden sm:block">
          <div className="text-2xl lg:text-3xl font-light text-white tabular-nums">
            {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs lg:text-sm text-slate-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniStatPill({
  icon: Icon,
  label,
  value,
  color,
  pulse,
  onClick,
  isActive,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'emerald' | 'blue' | 'cyan' | 'amber';
  pulse?: boolean;
  onClick?: () => void;
  isActive?: boolean;
}) {
  const colorClasses = {
    emerald: 'text-emerald-400',
    blue: 'text-blue-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
  };

  const activeClasses = {
    emerald: 'bg-emerald-500/20 border-emerald-400/50',
    blue: 'bg-blue-500/20 border-blue-400/50',
    cyan: 'bg-cyan-500/20 border-cyan-400/50',
    amber: 'bg-amber-500/20 border-amber-400/50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 flex-shrink-0 px-3 sm:px-3 py-2 sm:py-2 rounded-lg transition-all touch-manipulation ${
        isActive
          ? `${activeClasses[color]} border-2`
          : 'active:bg-slate-800/50 sm:hover:bg-slate-800/50 border-2 border-transparent'
      } ${onClick ? 'cursor-pointer' : ''}`}
      title={`Click to ${isActive ? 'clear' : 'view'} ${label.toLowerCase()}`}
    >
      <Icon className={`w-4 h-4 sm:w-4 sm:h-4 ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`} />
      <div className="flex items-baseline gap-1 sm:flex-col sm:gap-0">
        <span className="text-base sm:text-lg font-bold text-white">{value}</span>
        <span className="text-[10px] sm:text-xs text-slate-400 uppercase hidden sm:block">{label}</span>
      </div>
    </button>
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

function KnowledgeGraphPanel({ nodes, edges }: { nodes: { id: string; label: string; category: string | null; size: number; importance: number; roomMentions: Record<string, number>; energy: number }[]; edges: { source: string; target: string }[] }) {
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

      // Draw grip handle inside the TOP of the circle
      const handleY = pos.y - size / 4;
      const dotRadius = 1.5;
      const dotSpacingX = 4;
      const dotSpacingY = 3;
      const handleOpacity = (isHovered || isDragged) ? 0.9 : 0.35;

      ctx.fillStyle = `rgba(255, 255, 255, ${handleOpacity})`;
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const dotX = pos.x + (col - 1) * dotSpacingX;
          const dotY = handleY + row * dotSpacingY;
          ctx.beginPath();
          ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    clickStartPos.current = { x, y };

    const nodeId = getNodeAtPosition(x, y);
    if (nodeId) {
      setDraggedNodeId(nodeId);
      isDraggingRef.current = false;
    }
  }, [getNodeAtPosition]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length !== 1) return;

    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    if (draggedNodeId && clickStartPos.current) {
      const dx = x - clickStartPos.current.x;
      const dy = y - clickStartPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 10) {
        isDraggingRef.current = true;
        e.preventDefault();
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
    }
  }, [draggedNodeId]);

  const handleTouchEnd = useCallback(() => {
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

  return (
    <div className="h-full bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          <h2 className="text-sm sm:text-lg font-semibold text-white">Knowledge Network</h2>
        </div>
        <span className="text-xs sm:text-sm text-slate-400">{nodes.length} topics</span>
      </div>
      <div ref={containerRef} className="relative h-[calc(100%-40px)] sm:h-[calc(100%-52px)]">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: draggedNodeId ? 'grabbing' : (hoveredNodeId ? 'grab' : 'default') }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="text-center">
              <Brain className="w-10 h-10 sm:w-16 sm:h-16 text-slate-600 mx-auto mb-3 sm:mb-4" />
              <p className="text-slate-400 text-sm sm:text-base">Analyzing discussions...</p>
              <p className="text-xs sm:text-sm text-slate-500">Topics will appear as they're detected</p>
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
    <div className="h-full bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden">
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-700/50 flex items-center gap-2">
        <Target className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
        <h2 className="text-sm sm:text-lg font-semibold text-white">Topic Heat Map</h2>
      </div>

      <div className="p-2 sm:p-4 h-[calc(100%-40px)] sm:h-[calc(100%-52px)] overflow-auto">
        <div className="grid gap-0.5 sm:gap-1" style={{ gridTemplateColumns: `60px repeat(${rooms.length}, 1fr)` }}>
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

function InsightsFeed({ insights, onInsightClick }: { insights: InsightEvent[]; onInsightClick: (insight: InsightEvent) => void }) {
  const { selectedTopic, selectedRoom } = useAmbientSelection();
  const [isPaused, setIsPaused] = useState(false);
  const pauseTimeoutRef = useRef<NodeJS.Timeout>();

  const filteredInsights = insights.filter((insight) => {
    if (selectedTopic && !insight.related_topics.includes(selectedTopic.label)) {
      return false;
    }
    if (selectedRoom !== null && !insight.involved_rooms.includes(selectedRoom)) {
      return false;
    }
    return true;
  });

  const handleInteraction = () => {
    setIsPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => setIsPaused(false), 5000);
  };

  useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) {
        clearTimeout(pauseTimeoutRef.current);
      }
    };
  }, []);

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

  const scrollDuration = Math.max(30, filteredInsights.length * 4);

  const renderInsightCard = (insight: InsightEvent, index: number, keyPrefix: string = '') => {
    const Icon = getInsightIcon(insight.insight_type);
    const hasMatchingTopic = selectedTopic && insight.related_topics.includes(selectedTopic.label);
    return (
      <div
        key={`${keyPrefix}${insight.id}`}
        onClick={() => onInsightClick(insight)}
        className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${getInsightColors(insight.insight_type, insight.severity)} ${
          hasMatchingTopic ? 'ring-2 ring-blue-400/50' : ''
        } cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            insight.insight_type === 'misalignment' ? 'bg-amber-500/20 text-amber-400' :
            insight.insight_type === 'alignment' ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-white text-xs sm:text-sm leading-tight mb-1">
              {insight.title}
            </h4>
            <p className="text-[10px] sm:text-xs text-slate-300 line-clamp-2">
              {insight.description}
            </p>
            <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 flex-wrap">
              {insight.involved_rooms && insight.involved_rooms.length > 0 && (
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {insight.involved_rooms.slice(0, 4).map((room) => (
                    <span key={room} className={`px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs rounded ${
                      selectedRoom === room
                        ? 'bg-emerald-500/30 border border-emerald-400/50 text-emerald-300'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {room === 0 ? 'M' : room}
                    </span>
                  ))}
                </div>
              )}
              {hasMatchingTopic && (
                <span className="px-1.5 sm:px-2 py-0.5 bg-blue-500/20 border border-blue-400/40 text-[10px] sm:text-xs text-blue-300 rounded flex items-center gap-0.5 sm:gap-1">
                  <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="truncate max-w-[60px] sm:max-w-none">{selectedTopic.label}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-slate-900/50 rounded-xl sm:rounded-2xl border border-slate-700/50 backdrop-blur-sm overflow-hidden flex flex-col">
      <div className="px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <h2 className="text-sm sm:text-lg font-semibold text-white">Live Insights</h2>
        </div>
        <span className="px-2 py-0.5 sm:py-1 bg-slate-700/50 border border-slate-600/30 rounded-lg text-[10px] sm:text-xs text-slate-300">
          {filteredInsights.length}/{insights.length}
        </span>
      </div>

      <div
        className="flex-1 overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleInteraction}
        onWheel={handleInteraction}
      >
        {filteredInsights.length === 0 && insights.length > 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <Target className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm sm:text-base">No insights match filters</p>
              <p className="text-xs sm:text-sm text-slate-500">Try a different selection</p>
            </div>
          </div>
        ) : insights.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center">
              <Lightbulb className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm sm:text-base">Generating insights...</p>
              <p className="text-xs sm:text-sm text-slate-500">Patterns will appear here</p>
            </div>
          </div>
        ) : filteredInsights.length <= 3 ? (
          <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 overflow-y-auto h-full">
            {filteredInsights.map((insight, index) => renderInsightCard(insight, index))}
          </div>
        ) : (
          <div
            className={`animate-smooth-scroll p-2 sm:p-4 space-y-2 sm:space-y-3 ${isPaused ? 'paused' : ''}`}
            style={{ '--scroll-duration': `${scrollDuration}s` } as React.CSSProperties}
          >
            {filteredInsights.map((insight, index) => renderInsightCard(insight, index))}
            <div className="h-4" aria-hidden="true" />
            {filteredInsights.map((insight, index) => renderInsightCard(insight, index, 'dup-'))}
          </div>
        )}
      </div>
    </div>
  );
}

function MobileRoomStatusBar({ stats, summaries }: { stats: ReturnType<typeof useAmbientStats>['stats']; summaries: ReturnType<typeof useRoomSummaries>['summaries'] }) {
  const allRooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const { selectedRoom, setSelectedRoom } = useAmbientSelection();

  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 p-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-2 px-2">
        {allRooms.map((roomNumber) => {
          const isActive = roomNumber === 0 ? stats.roomStatus.main : stats.roomStatus.breakout.includes(roomNumber);
          const isSelected = selectedRoom === roomNumber;

          return (
            <button
              key={roomNumber}
              onClick={() => setSelectedRoom(isSelected ? null : roomNumber)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                isSelected
                  ? 'bg-blue-500/30 border border-blue-400 text-white'
                  : isActive
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/50 border border-slate-700/30 text-slate-500'
              }`}
            >
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              <span>{roomNumber === 0 ? 'Main' : `R${roomNumber}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Footer({ stats }: { stats: ReturnType<typeof useAmbientStats>['stats'] }) {
  return (
    <div className="hidden lg:flex mt-6 items-center justify-between text-sm text-slate-500">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time Analysis Active</span>
        </div>
        <span>Click topics to filter</span>
        <span>Press F for fullscreen</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(CATEGORY_COLORS).filter(([name]) => name !== 'General').map(([name, color]) => (
          <div key={name} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatDetailPanel({
  filterType,
  nodes,
  insights,
  summaries,
  stats,
  onClose,
}: {
  filterType: 'rooms' | 'topics' | 'aligned' | 'issues';
  nodes: any[];
  insights: InsightEvent[];
  summaries: any[];
  stats: ReturnType<typeof useAmbientStats>['stats'];
  onClose: () => void;
}) {
  const { setSelectedTopic, setSelectedRoom } = useAmbientSelection();
  const { isDemoMode, demoData } = useDemoMode();

  let title = '';
  let icon: React.ElementType = Activity;
  let color = 'blue';

  switch (filterType) {
    case 'rooms':
      title = 'Active Rooms';
      icon = Activity;
      color = 'emerald';
      break;
    case 'topics':
      title = 'All Topics';
      icon = Brain;
      color = 'blue';
      break;
    case 'aligned':
      title = 'Alignment Insights';
      icon = CheckCircle;
      color = 'cyan';
      break;
    case 'issues':
      title = 'Issues & Misalignments';
      icon = AlertTriangle;
      color = 'amber';
      break;
  }

  const Icon = icon;

  const filteredInsights =
    filterType === 'aligned'
      ? insights.filter((i) => i.insight_type === 'alignment')
      : filterType === 'issues'
      ? insights.filter((i) => i.insight_type === 'misalignment' || i.insight_type === 'gap')
      : insights;

  const activeMeetings = isDemoMode
    ? demoData.meetings.filter((m) => m.status === 'active')
    : [];

  const colorMap = {
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    blue: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  };

  return (
    <div className="fixed inset-0 sm:right-0 sm:left-auto sm:top-0 sm:bottom-0 w-full sm:w-[500px] lg:w-[600px] bg-slate-900/98 sm:bg-slate-900/95 backdrop-blur-xl sm:border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-slide-in">
      <div className="safe-top p-4 sm:p-6 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-12 h-12 sm:w-12 sm:h-12 ${colorMap[color as keyof typeof colorMap].bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-6 h-6 sm:w-6 sm:h-6 ${colorMap[color as keyof typeof colorMap].text}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-xl font-bold text-white truncate">{title}</h2>
            <p className="text-sm sm:text-sm text-slate-400">
              {filterType === 'rooms' && `${stats.activeRooms} active`}
              {filterType === 'topics' && `${nodes.length} topics`}
              {filterType === 'aligned' && `${stats.alignments} alignments`}
              {filterType === 'issues' && `${stats.misalignments} issues`}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 sm:w-10 sm:h-10 bg-slate-800/50 active:bg-slate-700/70 sm:hover:bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center transition-colors flex-shrink-0 ml-3"
        >
          <X className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4 pb-safe">
        {filterType === 'rooms' && (
          <>
            {activeMeetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => {
                  setSelectedRoom(meeting.room_number as number);
                  onClose();
                }}
                className="w-full bg-slate-800/50 active:bg-slate-700/70 sm:hover:bg-slate-700/50 border border-slate-600/50 active:border-emerald-400/50 sm:hover:border-emerald-400/50 rounded-xl p-4 sm:p-4 transition-all text-left group touch-manipulation"
              >
                <div className="flex items-start gap-3 sm:gap-3">
                  <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0 group-active:scale-95 sm:group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white mb-1 text-base sm:text-base truncate">
                      {meeting.room_type === 'main' ? 'Main Room' : meeting.topic?.split(' - ')[0] || `Room ${meeting.room_number}`}
                    </h3>
                    <p className="text-sm sm:text-sm text-slate-400 line-clamp-2 sm:truncate">
                      {meeting.topic?.split(' - ')[1] || meeting.topic}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs sm:text-xs text-slate-500">
                      <span className="truncate">Host: {meeting.host_name}</span>
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {filterType === 'topics' && (
          <>
            {nodes.map((node) => (
              <button
                key={node.id}
                onClick={() => {
                  setSelectedTopic(node);
                  onClose();
                }}
                className="w-full bg-slate-800/50 active:bg-slate-700/70 sm:hover:bg-slate-700/50 border border-slate-600/50 active:border-blue-400/50 sm:hover:border-blue-400/50 rounded-xl p-4 sm:p-4 transition-all text-left group touch-manipulation"
              >
                <div className="flex items-start gap-3 sm:gap-3">
                  <div
                    className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 group-active:scale-95 sm:group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${CATEGORY_COLORS[node.category || 'General']}40` }}
                  >
                    <Brain className="w-6 h-6 sm:w-5 sm:h-5" style={{ color: CATEGORY_COLORS[node.category || 'General'] }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                      <h3 className="font-bold text-white text-base sm:text-base truncate">{node.label}</h3>
                      {node.category && (
                        <span
                          className="px-2 py-1 rounded text-xs font-medium self-start sm:self-auto"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[node.category]}20`,
                            color: CATEGORY_COLORS[node.category],
                          }}
                        >
                          {node.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-xs text-slate-400">
                      <span>{Object.keys(node.roomMentions).length} rooms</span>
                      <span>{Math.round(node.importance * 100)}% importance</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </>
        )}

        {(filterType === 'aligned' || filterType === 'issues') && (
          <>
            {filteredInsights.map((insight) => {
              const severityColorMap = {
                info: { border: 'border-blue-500/30', bg: 'bg-blue-500/20', text: 'text-blue-400' },
                warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/20', text: 'text-amber-400' },
                alert: { border: 'border-red-500/30', bg: 'bg-red-500/20', text: 'text-red-400' },
              };
              const colorScheme = severityColorMap[insight.severity];

              return (
                <div
                  key={insight.id}
                  className={`bg-slate-800/50 border ${colorScheme.border} rounded-xl p-4 sm:p-4 transition-all`}
                >
                  <div className="flex items-start gap-3 sm:gap-3">
                    <div className={`w-12 h-12 sm:w-10 sm:h-10 ${colorScheme.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      {insight.insight_type === 'alignment' ? (
                        <CheckCircle className={`w-6 h-6 sm:w-5 sm:h-5 ${colorScheme.text}`} />
                      ) : (
                        <AlertTriangle className={`w-6 h-6 sm:w-5 sm:h-5 ${colorScheme.text}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white mb-1 text-base sm:text-base">{insight.title}</h3>
                      <p className="text-sm sm:text-sm text-slate-400 mb-3 leading-relaxed">{insight.description}</p>
                      <div className="flex flex-wrap gap-2">
                        {insight.involved_rooms.map((room) => (
                          <span
                            key={room}
                            className="px-2.5 py-1 bg-slate-700/50 rounded-md text-xs text-slate-300"
                          >
                            {room === 0 ? 'Main' : `R${room}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
