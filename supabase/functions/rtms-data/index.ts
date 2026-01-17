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
        .select("room_number")
        .eq("id", meeting.id)
        .maybeSingle();

      // Check for duplicate transcript with time window (5 seconds)
      // This catches duplicates even if timestamp varies slightly
      const timeWindowMs = 5000; // 5 seconds
      const { data: existingTranscripts } = await supabase
        .from("transcripts")
        .select("id, timestamp_ms, content")
        .eq("meeting_id", meeting.id)
        .gte("timestamp_ms", timestamp_ms - timeWindowMs)
        .lte("timestamp_ms", timestamp_ms + timeWindowMs)
        .limit(50);

      // Check if any existing transcript has identical content
      const duplicateTranscript = existingTranscripts?.find(
        (t) => t.content === content
      );

      // If duplicate exists, return success without inserting
      if (duplicateTranscript) {
        console.log(`[DUPLICATE PREVENTED] Meeting: ${meeting_uuid}, Timestamp: ${timestamp_ms}, Transcript ID: ${duplicateTranscript.id}`);
        return new Response(
          JSON.stringify({
            success: true,
            duplicate: true,
            transcript: { id: duplicateTranscript.id },
            message: "Transcript already recorded (duplicate prevented)",
            debug: {
              original_timestamp: duplicateTranscript.timestamp_ms,
              new_timestamp: timestamp_ms,
              time_diff_ms: Math.abs(duplicateTranscript.timestamp_ms - timestamp_ms)
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data, error } = await supabase.from("transcripts").insert({
        meeting_id: meeting.id,
        participant_id: dbParticipantId,
        speaker_name,
        content,
        timestamp_ms,
        sequence,
        is_final: is_final ?? true,
      }).select();

      if (error) {
        console.error("Error storing transcript:", error);

        // Check if it's a unique constraint violation (duplicate)
        if (error.code === "23505" || error.message?.includes("duplicate")) {
          return new Response(
            JSON.stringify({
              success: true,
              duplicate: true,
              message: "Transcript already recorded (duplicate prevented)"
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ error: "Failed to store transcript" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if ((is_final ?? true) && data?.[0]?.id) {
        await supabase.from("analysis_queue").insert({
          transcript_id: data[0].id,
          meeting_id: meeting.id,
          room_number: meetingInfo?.room_number ?? 0,
          status: "pending",
          priority: (meetingInfo?.room_number ?? 0) === 0 ? 10 : 5,
        });
      }

      return new Response(
        JSON.stringify({ success: true, transcript: data?.[0] }),
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