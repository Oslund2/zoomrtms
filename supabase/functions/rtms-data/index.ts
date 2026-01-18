import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Transcript buffering system for batching and reordering
interface BufferedTranscript {
  meeting_id: number;
  participant_id: number | null;
  speaker_name: string;
  content: string;
  timestamp_ms: number;
  sequence: number | null;
  is_final: boolean;
  room_number: number;
  received_at: number;
}

interface TranscriptBuffer {
  transcripts: BufferedTranscript[];
  timer: number | null;
}

const buffers = new Map<number, TranscriptBuffer>();
const BUFFER_TIMEOUT_MS = 2500; // 2.5 seconds to collect and reorder transcripts

async function flushTranscriptBuffer(meetingId: number) {
  const buffer = buffers.get(meetingId);
  if (!buffer || buffer.transcripts.length === 0) {
    return;
  }

  // Clear the timer
  if (buffer.timer) {
    clearTimeout(buffer.timer);
  }

  // Take all transcripts and clear buffer immediately
  const transcriptsToProcess = [...buffer.transcripts];
  buffer.transcripts = [];
  buffer.timer = null;

  // Sort by sequence number (nulls last), then by timestamp
  transcriptsToProcess.sort((a, b) => {
    if (a.sequence !== null && b.sequence !== null) {
      return a.sequence - b.sequence;
    }
    if (a.sequence !== null) return -1;
    if (b.sequence !== null) return 1;
    return a.timestamp_ms - b.timestamp_ms;
  });

  console.log(`[BATCH] Flushing ${transcriptsToProcess.length} transcripts for meeting ${meetingId}`);

  // Get all existing transcripts in relevant time window for duplicate detection
  const timestamps = transcriptsToProcess.map(t => t.timestamp_ms);
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const timeWindowMs = 5000;

  const { data: existingTranscripts } = await supabase
    .from("transcripts")
    .select("id, timestamp_ms, content")
    .eq("meeting_id", meetingId)
    .gte("timestamp_ms", minTimestamp - timeWindowMs)
    .lte("timestamp_ms", maxTimestamp + timeWindowMs);

  const existingContentSet = new Set(
    existingTranscripts?.map(t => t.content) || []
  );

  // Filter out duplicates
  const uniqueTranscripts = transcriptsToProcess.filter(
    t => !existingContentSet.has(t.content)
  );

  if (uniqueTranscripts.length === 0) {
    console.log(`[BATCH] All ${transcriptsToProcess.length} transcripts were duplicates, skipping insert`);
    return;
  }

  console.log(`[BATCH] Inserting ${uniqueTranscripts.length} unique transcripts (filtered ${transcriptsToProcess.length - uniqueTranscripts.length} duplicates)`);

  // Batch insert all unique transcripts
  const { data: insertedTranscripts, error } = await supabase
    .from("transcripts")
    .insert(
      uniqueTranscripts.map(t => ({
        meeting_id: t.meeting_id,
        participant_id: t.participant_id,
        speaker_name: t.speaker_name,
        content: t.content,
        timestamp_ms: t.timestamp_ms,
        sequence: t.sequence,
        is_final: t.is_final,
      }))
    )
    .select();

  if (error) {
    console.error("[BATCH] Error inserting transcripts:", error);
    return;
  }

  // Queue final transcripts for analysis
  const analysisQueue = insertedTranscripts
    ?.filter((_, idx) => uniqueTranscripts[idx].is_final)
    .map((transcript, idx) => ({
      transcript_id: transcript.id,
      meeting_id: meetingId,
      room_number: uniqueTranscripts[idx].room_number,
      status: "pending",
      priority: uniqueTranscripts[idx].room_number === 0 ? 10 : 5,
    })) || [];

  if (analysisQueue.length > 0) {
    await supabase.from("analysis_queue").insert(analysisQueue);
  }

  console.log(`[BATCH] Successfully inserted ${insertedTranscripts?.length || 0} transcripts, queued ${analysisQueue.length} for analysis`);
}

function addTranscriptToBuffer(transcript: BufferedTranscript) {
  const meetingId = transcript.meeting_id;

  let buffer = buffers.get(meetingId);
  if (!buffer) {
    buffer = { transcripts: [], timer: null };
    buffers.set(meetingId, buffer);
  }

  // Add transcript to buffer
  buffer.transcripts.push(transcript);

  // Reset timer
  if (buffer.timer) {
    clearTimeout(buffer.timer);
  }

  buffer.timer = setTimeout(() => {
    flushTranscriptBuffer(meetingId);
  }, BUFFER_TIMEOUT_MS);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/").filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    const body = await req.json();

    // Determine action from body.type first, then fall back to URL path
    const requestType = body.type || action;

    if (requestType === "transcript" || (req.method === "POST" && body.speaker_name && body.content)) {
      const { meeting_uuid, speaker_name, content, timestamp_ms, participant_id, is_final, sequence } = body;

      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (!meeting) {
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let dbParticipantId = null;
      if (participant_id) {
        const { data: participant } = await supabase
          .from("participants")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("participant_id", participant_id)
          .maybeSingle();
        dbParticipantId = participant?.id;
      }

      const { data: meetingInfo } = await supabase
        .from("meetings")
        .select("room_number, room_type")
        .eq("id", meeting.id)
        .maybeSingle();

      const effectiveRoomNumber = meetingInfo?.room_number ?? (meetingInfo?.room_type === 'breakout' ? 1 : 0);

      // Add to buffer instead of inserting immediately
      addTranscriptToBuffer({
        meeting_id: meeting.id,
        participant_id: dbParticipantId,
        speaker_name,
        content,
        timestamp_ms,
        sequence: sequence ?? null,
        is_final: is_final ?? true,
        room_number: effectiveRoomNumber,
        received_at: Date.now(),
      });

      return new Response(
        JSON.stringify({
          success: true,
          buffered: true,
          message: "Transcript queued for batch processing"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestType === "chat" || (body.message && body.sender_name)) {
      const { meeting_uuid, sender_name, message, message_type, recipient, timestamp_ms, participant_id } = body;

      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (!meeting) {
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let dbParticipantId = null;
      if (participant_id) {
        const { data: participant } = await supabase
          .from("participants")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("participant_id", participant_id)
          .maybeSingle();
        dbParticipantId = participant?.id;
      }

      const { data, error } = await supabase.from("chat_messages").insert({
        meeting_id: meeting.id,
        participant_id: dbParticipantId,
        sender_name,
        message,
        message_type: message_type || "text",
        recipient: recipient || "everyone",
        timestamp_ms,
      }).select();

      if (error) {
        console.error("Error storing chat message:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store chat message" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, chat: data?.[0] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestType === "media-event" || requestType === "media_event" || (body.event_type && body.action)) {
      const { meeting_uuid, event_type, participant_id, action: eventAction, bytes_processed, metadata } = body;

      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (!meeting) {
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      let dbParticipantId = null;
      if (participant_id) {
        const { data: participant } = await supabase
          .from("participants")
          .select("id")
          .eq("meeting_id", meeting.id)
          .eq("participant_id", participant_id)
          .maybeSingle();
        dbParticipantId = participant?.id;
      }

      const { data, error } = await supabase.from("media_events").insert({
        meeting_id: meeting.id,
        event_type,
        participant_id: dbParticipantId,
        action: eventAction,
        bytes_processed: bytes_processed || 0,
        metadata: metadata || {},
      }).select();

      if (error) {
        console.error("Error storing media event:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store media event" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, event: data?.[0] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (requestType === "participant" || (body.participant_id && body.action)) {
      const { meeting_uuid, participant_id, user_name, email, role, action: participantAction } = body;

      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (!meeting) {
        return new Response(
          JSON.stringify({ error: "Meeting not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (participantAction === "joined") {
        const { data, error } = await supabase.from("participants").upsert(
          {
            meeting_id: meeting.id,
            participant_id,
            user_name,
            email,
            role: role || "participant",
            is_active: true,
            joined_at: new Date().toISOString(),
          },
          { onConflict: "meeting_id,participant_id" }
        ).select();

        if (error) {
          console.error("Error storing participant:", error);
        }

        return new Response(
          JSON.stringify({ success: true, participant: data?.[0] }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (participantAction === "left") {
        const { error } = await supabase
          .from("participants")
          .update({ is_active: false, left_at: new Date().toISOString() })
          .eq("meeting_id", meeting.id)
          .eq("participant_id", participant_id);

        if (error) {
          console.error("Error updating participant:", error);
        }

        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("RTMS data error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
