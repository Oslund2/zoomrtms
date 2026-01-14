import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface AnalysisResult {
  summary: string;
  sentiment: number;
  topics: { label: string; category: string; description: string }[];
  relationships: { source: string; target: string; type: string }[];
  insights: { type: string; severity: string; title: string; description: string }[];
  actionItems: string[];
  speakers: string[];
}

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

function parseAnalysisResponse(text: string): AnalysisResult {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
  }

  return {
    summary: text.slice(0, 500),
    sentiment: 0,
    topics: [],
    relationships: [],
    insights: [],
    actionItems: [],
    speakers: [],
  };
}

async function getPrompts(roomNumber: number): Promise<{ global: string; room: string }> {
  const { data: prompts } = await supabase
    .from("prompt_configs")
    .select("*")
    .eq("is_active", true)
    .or(`scope.eq.global,and(scope.eq.room,room_number.eq.${roomNumber})`);

  const globalPrompt = prompts?.find((p) => p.scope === "global")?.prompt_text || "";
  const roomPrompt = prompts?.find((p) => p.scope === "room" && p.room_number === roomNumber)?.prompt_text || "";

  return { global: globalPrompt, room: roomPrompt };
}

async function getExternalContext(query: string): Promise<string> {
  const { data } = await supabase
    .from("external_contexts")
    .select("title, content")
    .limit(5);

  if (!data || data.length === 0) return "";

  return data.map((d) => `[${d.title}]: ${d.content.slice(0, 500)}`).join("\n\n");
}

async function analyzeRoom(meetingId: string, roomNumber: number, transcripts: { speaker_name: string; content: string }[]): Promise<AnalysisResult> {
  const { global: globalPrompt, room: roomPrompt } = await getPrompts(roomNumber);
  const externalContext = await getExternalContext(transcripts.map((t) => t.content).join(" "));

  const conversationText = transcripts
    .map((t) => `${t.speaker_name || "Unknown"}: ${t.content}`)
    .join("\n");

  const prompt = `${globalPrompt}

${roomPrompt}

${externalContext ? `EXTERNAL CONTEXT DOCUMENTS:\n${externalContext}\n\n` : ""}TRANSCRIPT FROM ROOM ${roomNumber === 0 ? "MAIN" : roomNumber}:
${conversationText}

Analyze this transcript and respond with a JSON object containing:
{
  "summary": "Brief 2-3 sentence summary of discussions",
  "sentiment": <number from -1 to 1 indicating overall sentiment>,
  "topics": [{"label": "topic name", "category": "theme category", "description": "brief description"}],
  "relationships": [{"source": "topic1", "target": "topic2", "type": "related_to|depends_on|conflicts_with|supports"}],
  "insights": [{"type": "alignment|misalignment|gap|highlight|action", "severity": "info|warning|alert", "title": "short title", "description": "full insight"}],
  "actionItems": ["action item 1", "action item 2"],
  "speakers": ["speaker names mentioned"]
}

Respond ONLY with the JSON object, no other text.`;

  const response = await callGemini(prompt);
  return parseAnalysisResponse(response);
}

async function crossRoomAnalysis(roomSummaries: { roomNumber: number; summary: string; topics: string[] }[]): Promise<{ insights: { type: string; severity: string; title: string; description: string; rooms: number[] }[] }> {
  const { global: globalPrompt } = await getPrompts(0);

  const summaryText = roomSummaries
    .map((r) => `Room ${r.roomNumber === 0 ? "Main" : r.roomNumber}: ${r.summary}\nTopics: ${r.topics.join(", ")}`)
    .join("\n\n");

  const prompt = `${globalPrompt}

CROSS-ROOM ANALYSIS:
Compare discussions across all rooms to identify alignments, misalignments, and gaps.

${summaryText}

Respond with a JSON object:
{
  "insights": [
    {
      "type": "alignment|misalignment|gap",
      "severity": "info|warning|alert",
      "title": "short headline",
      "description": "detailed description of the cross-room insight",
      "rooms": [0, 1, 2]
    }
  ]
}

Respond ONLY with the JSON object.`;

  const response = await callGemini(prompt);
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Failed to parse cross-room analysis:", e);
  }

  return { insights: [] };
}

async function processQueue() {
  const { data: queueItems } = await supabase
    .from("analysis_queue")
    .select("*, transcripts(*, meetings(*))")
    .eq("status", "pending")
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);

  if (!queueItems || queueItems.length === 0) {
    return { processed: 0 };
  }

  const groupedByRoom: Record<string, { meetingId: string; roomNumber: number; transcripts: { speaker_name: string; content: string }[]; queueIds: string[] }> = {};

  for (const item of queueItems) {
    const key = `${item.meeting_id}-${item.room_number}`;
    if (!groupedByRoom[key]) {
      groupedByRoom[key] = {
        meetingId: item.meeting_id,
        roomNumber: item.room_number,
        transcripts: [],
        queueIds: [],
      };
    }
    groupedByRoom[key].transcripts.push({
      speaker_name: item.transcripts?.speaker_name || "Unknown",
      content: item.transcripts?.content || "",
    });
    groupedByRoom[key].queueIds.push(item.id);
  }

  for (const key of Object.keys(groupedByRoom)) {
    const group = groupedByRoom[key];

    await supabase
      .from("analysis_queue")
      .update({ status: "processing" })
      .in("id", group.queueIds);

    try {
      const result = await analyzeRoom(group.meetingId, group.roomNumber, group.transcripts);

      await supabase.from("analysis_summaries").insert({
        meeting_id: group.meetingId,
        room_number: group.roomNumber,
        summary_type: "room",
        content: result.summary,
        sentiment_score: result.sentiment,
        key_topics: result.topics.map((t) => t.label),
        key_speakers: result.speakers,
        action_items: result.actionItems,
      });

      for (const topic of result.topics) {
        const { data: existing } = await supabase
          .from("topic_nodes")
          .select("*")
          .eq("label", topic.label)
          .maybeSingle();

        if (existing) {
          const roomMentions = existing.room_mentions || {};
          roomMentions[group.roomNumber] = (roomMentions[group.roomNumber] || 0) + 1;

          await supabase
            .from("topic_nodes")
            .update({
              mention_count: existing.mention_count + 1,
              room_mentions: roomMentions,
              importance_score: existing.mention_count + 1 + Object.keys(roomMentions).length * 2,
              last_seen: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("topic_nodes").insert({
            label: topic.label,
            description: topic.description,
            category: topic.category,
            mention_count: 1,
            room_mentions: { [group.roomNumber]: 1 },
            importance_score: 1,
          });
        }
      }

      for (const rel of result.relationships) {
        const { data: sourceNode } = await supabase
          .from("topic_nodes")
          .select("id")
          .eq("label", rel.source)
          .maybeSingle();

        const { data: targetNode } = await supabase
          .from("topic_nodes")
          .select("id")
          .eq("label", rel.target)
          .maybeSingle();

        if (sourceNode && targetNode) {
          await supabase.from("topic_edges").upsert(
            {
              source_node_id: sourceNode.id,
              target_node_id: targetNode.id,
              relationship_type: rel.type as "related_to" | "depends_on" | "conflicts_with" | "supports",
              weight: 1,
              room_context: { [group.roomNumber]: true },
            },
            { onConflict: "source_node_id,target_node_id" }
          );
        }
      }

      for (const insight of result.insights) {
        await supabase.from("insight_events").insert({
          insight_type: insight.type as "alignment" | "misalignment" | "gap" | "highlight" | "action",
          severity: insight.severity as "info" | "warning" | "alert",
          title: insight.title,
          description: insight.description,
          involved_rooms: [group.roomNumber],
          related_topics: result.topics.map((t) => t.label),
        });
      }

      await supabase
        .from("analysis_queue")
        .update({ status: "completed", processed_at: new Date().toISOString() })
        .in("id", group.queueIds);
    } catch (err) {
      console.error(`Error processing room ${group.roomNumber}:`, err);
      await supabase
        .from("analysis_queue")
        .update({ status: "failed", error_message: err.message, retry_count: 1 })
        .in("id", group.queueIds);
    }
  }

  const { data: recentSummaries } = await supabase
    .from("analysis_summaries")
    .select("room_number, content, key_topics")
    .eq("summary_type", "room")
    .order("created_at", { ascending: false })
    .limit(9);

  if (recentSummaries && recentSummaries.length >= 2) {
    const uniqueRooms = [...new Set(recentSummaries.map((s) => s.room_number))];
    if (uniqueRooms.length >= 2) {
      const roomSummaries = uniqueRooms.map((rn) => {
        const summary = recentSummaries.find((s) => s.room_number === rn);
        return {
          roomNumber: rn,
          summary: summary?.content || "",
          topics: (summary?.key_topics as string[]) || [],
        };
      });

      const crossRoomResult = await crossRoomAnalysis(roomSummaries);

      for (const insight of crossRoomResult.insights) {
        await supabase.from("insight_events").insert({
          insight_type: insight.type as "alignment" | "misalignment" | "gap" | "highlight" | "action",
          severity: insight.severity as "info" | "warning" | "alert",
          title: insight.title,
          description: insight.description,
          involved_rooms: insight.rooms,
          related_topics: [],
        });
      }
    }
  }

  return { processed: queueItems.length };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === "POST") {
      const body = await req.json();

      if (body.action === "queue_transcript") {
        const { transcript_id, meeting_id, room_number } = body;

        const { data, error } = await supabase.from("analysis_queue").insert({
          transcript_id,
          meeting_id,
          room_number: room_number ?? 0,
          status: "pending",
          priority: room_number === 0 ? 10 : 5,
        }).select().single();

        if (error) throw error;

        return new Response(JSON.stringify({ data }), {
          status: 201,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "process_queue") {
        const result = await processQueue();

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (body.action === "analyze_now") {
        const { meeting_id, room_number, transcripts } = body;
        const result = await analyzeRoom(meeting_id, room_number, transcripts);

        return new Response(JSON.stringify({ data: result }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (req.method === "GET") {
      const { data: queueStats } = await supabase
        .from("analysis_queue")
        .select("status")
        .order("created_at", { ascending: false })
        .limit(100);

      const stats = {
        pending: queueStats?.filter((q) => q.status === "pending").length || 0,
        processing: queueStats?.filter((q) => q.status === "processing").length || 0,
        completed: queueStats?.filter((q) => q.status === "completed").length || 0,
        failed: queueStats?.filter((q) => q.status === "failed").length || 0,
      };

      return new Response(JSON.stringify({ stats }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Analysis error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});