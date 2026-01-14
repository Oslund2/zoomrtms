import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const dataType = url.searchParams.get("type") || "all";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const sinceMinutes = parseInt(url.searchParams.get("since_minutes") || "60");

    const sinceTime = new Date(Date.now() - sinceMinutes * 60 * 1000).toISOString();

    const response: Record<string, unknown> = {};

    if (dataType === "all" || dataType === "graph") {
      const { data: nodes } = await supabase
        .from("topic_nodes")
        .select("*")
        .gte("last_seen", sinceTime)
        .order("importance_score", { ascending: false })
        .limit(limit);

      const nodeIds = nodes?.map((n) => n.id) || [];

      const { data: edges } = await supabase
        .from("topic_edges")
        .select("*")
        .or(`source_node_id.in.(${nodeIds.join(",")}),target_node_id.in.(${nodeIds.join(",")})`);

      response.graph = {
        nodes: nodes?.map((n) => ({
          id: n.id,
          label: n.label,
          category: n.category,
          size: Math.min(50, 10 + n.mention_count * 3),
          roomMentions: n.room_mentions,
          importance: n.importance_score,
        })) || [],
        edges: edges?.map((e) => ({
          id: e.id,
          source: e.source_node_id,
          target: e.target_node_id,
          type: e.relationship_type,
          weight: e.weight,
        })) || [],
      };
    }

    if (dataType === "all" || dataType === "insights") {
      const { data: insights } = await supabase
        .from("insight_events")
        .select("*")
        .gte("created_at", sinceTime)
        .order("created_at", { ascending: false })
        .limit(limit);

      response.insights = insights || [];
    }

    if (dataType === "all" || dataType === "heatmap") {
      const { data: summaries } = await supabase
        .from("analysis_summaries")
        .select("room_number, key_topics, sentiment_score, created_at")
        .gte("created_at", sinceTime)
        .eq("summary_type", "room");

      const { data: topics } = await supabase
        .from("topic_nodes")
        .select("label, category")
        .order("importance_score", { ascending: false })
        .limit(20);

      const categories = [...new Set(topics?.map((t) => t.category).filter(Boolean) || [])];
      const rooms = [0, 1, 2, 3, 4, 5, 6, 7, 8];

      const heatmapData: { room: number; category: string; intensity: number; topics: string[] }[] = [];

      for (const room of rooms) {
        const roomSummaries = summaries?.filter((s) => s.room_number === room) || [];
        const roomTopics = roomSummaries.flatMap((s) => (s.key_topics as string[]) || []);

        for (const category of categories) {
          const categoryTopics = topics?.filter((t) => t.category === category).map((t) => t.label) || [];
          const matchingTopics = roomTopics.filter((t) => categoryTopics.includes(t));

          heatmapData.push({
            room,
            category: category || "General",
            intensity: Math.min(1, matchingTopics.length / 5),
            topics: [...new Set(matchingTopics)],
          });
        }
      }

      response.heatmap = {
        data: heatmapData,
        categories: categories.length > 0 ? categories : ["Strategy", "Operations", "Technology", "People", "Finance"],
        rooms: rooms.map((r) => (r === 0 ? "Main" : `Room ${r}`)),
      };
    }

    if (dataType === "all" || dataType === "summaries") {
      const { data: summaries } = await supabase
        .from("analysis_summaries")
        .select("*")
        .gte("created_at", sinceTime)
        .order("created_at", { ascending: false })
        .limit(limit);

      response.summaries = summaries || [];
    }

    if (dataType === "all" || dataType === "stats") {
      const { data: nodes } = await supabase
        .from("topic_nodes")
        .select("id")
        .gte("last_seen", sinceTime);

      const { data: insights } = await supabase
        .from("insight_events")
        .select("insight_type")
        .gte("created_at", sinceTime);

      const { data: activeMeetings } = await supabase
        .from("meetings")
        .select("id, room_number, room_type")
        .eq("status", "active");

      response.stats = {
        totalTopics: nodes?.length || 0,
        totalInsights: insights?.length || 0,
        alignments: insights?.filter((i) => i.insight_type === "alignment").length || 0,
        misalignments: insights?.filter((i) => i.insight_type === "misalignment").length || 0,
        gaps: insights?.filter((i) => i.insight_type === "gap").length || 0,
        activeRooms: activeMeetings?.length || 0,
        roomStatus: {
          main: activeMeetings?.some((m) => m.room_type === "main") || false,
          breakout: activeMeetings?.filter((m) => m.room_type === "breakout").map((m) => m.room_number) || [],
        },
      };
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Ambient data error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});