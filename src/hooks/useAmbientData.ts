import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useDemoMode } from '../contexts/DemoModeContext';
import type {
  PromptConfig,
  ExternalContext,
  TopicNode,
  TopicEdge,
  InsightEvent,
  AnalysisSummary,
} from '../types/database';

interface GraphNode {
  id: string;
  label: string;
  category: string | null;
  size: number;
  roomMentions: Record<string, number>;
  importance: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
}

interface HeatmapCell {
  room: number;
  category: string;
  intensity: number;
  topics: string[];
}

interface AmbientStats {
  totalTopics: number;
  totalInsights: number;
  alignments: number;
  misalignments: number;
  gaps: number;
  activeRooms: number;
  roomStatus: {
    main: boolean;
    breakout: number[];
  };
}

export function usePromptConfigs() {
  const [prompts, setPrompts] = useState<PromptConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrompts = useCallback(async () => {
    const { data } = await supabase
      .from('prompt_configs')
      .select('*')
      .order('room_number', { ascending: true, nullsFirst: true });
    setPrompts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrompts();

    const channel = supabase
      .channel('prompt-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prompt_configs' }, fetchPrompts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPrompts]);

  const updatePrompt = async (id: string, updates: { name?: string; prompt_text?: string; is_active?: boolean }) => {
    const { error } = await supabase.from('prompt_configs').update(updates).eq('id', id);
    if (!error) fetchPrompts();
    return { error };
  };

  return { prompts, loading, updatePrompt, refetch: fetchPrompts };
}

export function useExternalContexts() {
  const [contexts, setContexts] = useState<ExternalContext[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchContexts = useCallback(async () => {
    const { data } = await supabase
      .from('external_contexts')
      .select('*')
      .order('created_at', { ascending: false });
    setContexts(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContexts();
  }, [fetchContexts]);

  const deleteContext = async (fileName: string) => {
    const { error } = await supabase.from('external_contexts').delete().eq('file_name', fileName);
    if (!error) fetchContexts();
    return { error };
  };

  return { contexts, loading, deleteContext, refetch: fetchContexts };
}

export function useKnowledgeGraph(sinceMinutes = 60) {
  const { isDemoMode, demoData } = useDemoMode();
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 400));

      const rawNodes = demoData.topicNodes.slice(0, 25);
      const nodeIds = rawNodes.map((n) => n.id);
      const rawEdges = demoData.topicEdges.filter(
        (e) => nodeIds.includes(e.source_node_id) && nodeIds.includes(e.target_node_id)
      );

      setNodes(
        rawNodes.map((n) => ({
          id: n.id,
          label: n.label,
          category: n.category,
          size: Math.min(50, 10 + n.mention_count * 3),
          roomMentions: n.room_mentions as Record<string, number>,
          importance: n.importance_score,
        }))
      );

      setEdges(
        rawEdges.map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          type: e.relationship_type,
          weight: e.weight,
        }))
      );

      setLoading(false);
      return;
    }

    const sinceTime = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

    const { data: rawNodes } = await supabase
      .from('topic_nodes')
      .select('*')
      .gte('last_seen', sinceTime)
      .order('importance_score', { ascending: false })
      .limit(50);

    const nodeIds = rawNodes?.map((n) => n.id) || [];

    let rawEdges: TopicEdge[] = [];
    if (nodeIds.length > 0) {
      const { data } = await supabase
        .from('topic_edges')
        .select('*');
      rawEdges = (data || []).filter(
        (e) => nodeIds.includes(e.source_node_id) || nodeIds.includes(e.target_node_id)
      );
    }

    setNodes(
      rawNodes?.map((n) => ({
        id: n.id,
        label: n.label,
        category: n.category,
        size: Math.min(50, 10 + n.mention_count * 3),
        roomMentions: n.room_mentions as Record<string, number>,
        importance: n.importance_score,
      })) || []
    );

    setEdges(
      rawEdges.map((e) => ({
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        type: e.relationship_type,
        weight: e.weight,
      }))
    );

    setLoading(false);
  }, [sinceMinutes, isDemoMode, demoData]);

  useEffect(() => {
    fetchGraph();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('graph-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_nodes' }, fetchGraph)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topic_edges' }, fetchGraph)
      .subscribe();

    const interval = setInterval(fetchGraph, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchGraph, isDemoMode]);

  return { nodes, edges, loading, refetch: fetchGraph };
}

export function useInsights(limit = 20) {
  const { isDemoMode, demoData } = useDemoMode();
  const [insights, setInsights] = useState<InsightEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = useCallback(async () => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setInsights(demoData.insights.slice(0, limit));
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('insight_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    setInsights(data || []);
    setLoading(false);
  }, [limit, isDemoMode, demoData]);

  useEffect(() => {
    fetchInsights();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('insights-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'insight_events' }, fetchInsights)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchInsights, isDemoMode]);

  return { insights, loading, refetch: fetchInsights };
}

export function useHeatmap() {
  const { isDemoMode, demoData } = useDemoMode();
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHeatmap = useCallback(async () => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 400));

      const summaries = demoData.summaries;
      const topics = demoData.topicNodes;

      const uniqueCategories = [...new Set(topics.map((t) => t.category).filter(Boolean))];
      const cats = uniqueCategories.length > 0 ? uniqueCategories : ['Strategy', 'Operations', 'Technology', 'People', 'Finance'];
      setCategories(cats as string[]);

      const rooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      const data: HeatmapCell[] = [];

      for (const room of rooms) {
        const roomSummaries = summaries.filter((s) => s.room_number === room);
        const roomTopics = roomSummaries.flatMap((s) => (s.key_topics as string[]));

        for (const category of cats) {
          const categoryTopics = topics.filter((t) => t.category === category).map((t) => t.label);
          const matchingTopics = roomTopics.filter((t) => categoryTopics.includes(t));

          data.push({
            room,
            category: category as string,
            intensity: Math.min(1, matchingTopics.length / 5),
            topics: [...new Set(matchingTopics)],
          });
        }
      }

      setHeatmapData(data);
      setLoading(false);
      return;
    }

    const sinceTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: summaries } = await supabase
      .from('analysis_summaries')
      .select('room_number, key_topics')
      .gte('created_at', sinceTime)
      .eq('summary_type', 'room');

    const { data: topics } = await supabase
      .from('topic_nodes')
      .select('label, category')
      .order('importance_score', { ascending: false })
      .limit(30);

    const uniqueCategories = [...new Set(topics?.map((t) => t.category).filter(Boolean) || [])];
    const cats = uniqueCategories.length > 0 ? uniqueCategories : ['Strategy', 'Operations', 'Technology', 'People', 'Finance'];
    setCategories(cats as string[]);

    const rooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    const data: HeatmapCell[] = [];

    for (const room of rooms) {
      const roomSummaries = summaries?.filter((s) => s.room_number === room) || [];
      const roomTopics = roomSummaries.flatMap((s) => (s.key_topics as string[]) || []);

      for (const category of cats) {
        const categoryTopics = topics?.filter((t) => t.category === category).map((t) => t.label) || [];
        const matchingTopics = roomTopics.filter((t) => categoryTopics.includes(t));

        data.push({
          room,
          category: category as string,
          intensity: Math.min(1, matchingTopics.length / 5),
          topics: [...new Set(matchingTopics)],
        });
      }
    }

    setHeatmapData(data);
    setLoading(false);
  }, [isDemoMode, demoData]);

  useEffect(() => {
    fetchHeatmap();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('heatmap-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'analysis_summaries' }, fetchHeatmap)
      .subscribe();

    const interval = setInterval(fetchHeatmap, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchHeatmap, isDemoMode]);

  return { heatmapData, categories, loading, refetch: fetchHeatmap };
}

export function useAmbientStats() {
  const { isDemoMode, demoData } = useDemoMode();
  const [stats, setStats] = useState<AmbientStats>({
    totalTopics: 0,
    totalInsights: 0,
    alignments: 0,
    misalignments: 0,
    gaps: 0,
    activeRooms: 0,
    roomStatus: { main: false, breakout: [] },
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));

      const insights = demoData.insights;
      const meetings = demoData.meetings.filter(m => m.status === 'active');

      setStats({
        totalTopics: demoData.topicNodes.length,
        totalInsights: insights.length,
        alignments: insights.filter((i) => i.insight_type === 'alignment').length,
        misalignments: insights.filter((i) => i.insight_type === 'misalignment').length,
        gaps: insights.filter((i) => i.insight_type === 'gap').length,
        activeRooms: meetings.length,
        roomStatus: {
          main: meetings.some((m) => m.room_type === 'main'),
          breakout: meetings.filter((m) => m.room_type === 'breakout').map((m) => m.room_number as number),
        },
      });
      setLoading(false);
      return;
    }

    const sinceTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const [nodesRes, insightsRes, meetingsRes] = await Promise.all([
      supabase.from('topic_nodes').select('id').gte('last_seen', sinceTime),
      supabase.from('insight_events').select('insight_type').gte('created_at', sinceTime),
      supabase.from('meetings').select('id, room_number, room_type').eq('status', 'active'),
    ]);

    const insights = insightsRes.data || [];
    const meetings = meetingsRes.data || [];

    setStats({
      totalTopics: nodesRes.data?.length || 0,
      totalInsights: insights.length,
      alignments: insights.filter((i) => i.insight_type === 'alignment').length,
      misalignments: insights.filter((i) => i.insight_type === 'misalignment').length,
      gaps: insights.filter((i) => i.insight_type === 'gap').length,
      activeRooms: meetings.length,
      roomStatus: {
        main: meetings.some((m) => m.room_type === 'main'),
        breakout: meetings.filter((m) => m.room_type === 'breakout').map((m) => m.room_number as number),
      },
    });
    setLoading(false);
  }, [isDemoMode, demoData]);

  useEffect(() => {
    fetchStats();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('stats-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meetings' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'insight_events' }, fetchStats)
      .subscribe();

    const interval = setInterval(fetchStats, 15000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchStats, isDemoMode]);

  return { stats, loading, refetch: fetchStats };
}

export function useRoomSummaries() {
  const { isDemoMode, demoData } = useDemoMode();
  const [summaries, setSummaries] = useState<AnalysisSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSummaries = useCallback(async () => {
    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 300));

      const uniqueRooms = new Map<number, AnalysisSummary>();
      demoData.summaries.forEach((s) => {
        if (!uniqueRooms.has(s.room_number)) {
          uniqueRooms.set(s.room_number, s);
        }
      });

      setSummaries(Array.from(uniqueRooms.values()));
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('analysis_summaries')
      .select('*')
      .eq('summary_type', 'room')
      .order('created_at', { ascending: false })
      .limit(18);

    const uniqueRooms = new Map<number, AnalysisSummary>();
    data?.forEach((s) => {
      if (!uniqueRooms.has(s.room_number)) {
        uniqueRooms.set(s.room_number, s);
      }
    });

    setSummaries(Array.from(uniqueRooms.values()));
    setLoading(false);
  }, [isDemoMode, demoData]);

  useEffect(() => {
    fetchSummaries();

    if (isDemoMode) {
      return;
    }

    const channel = supabase
      .channel('summaries-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'analysis_summaries' }, fetchSummaries)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSummaries, isDemoMode]);

  return { summaries, loading, refetch: fetchSummaries };
}
