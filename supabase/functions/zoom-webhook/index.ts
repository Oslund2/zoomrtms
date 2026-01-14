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

function generateSignature(message: string, secret: string): string {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = new Uint8Array(keyData);
  let hash = 0x811c9dc5;
  for (let i = 0; i < messageData.length; i++) {
    hash ^= messageData[i];
    hash = Math.imul(hash, 0x01000193);
  }
  return hash.toString(16);
}

async function hmacSha256(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { event, payload } = body;

    if (event === "endpoint.url_validation" && payload?.plainToken) {
      const secretToken = Deno.env.get("ZOOM_WEBHOOK_SECRET") ?? "";
      const encryptedToken = await hmacSha256(payload.plainToken, secretToken);
      
      return new Response(
        JSON.stringify({
          plainToken: payload.plainToken,
          encryptedToken: encryptedToken,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (event === "meeting.rtms_started") {
      const {
        meeting_uuid,
        rtms_stream_id,
        server_urls,
        operator_id,
        operator,
      } = payload;

      const meetingTopic = payload.object?.topic || "Untitled Meeting";
      const hostName = operator?.display_name || payload.object?.host?.name || "Unknown Host";

      const { data, error } = await supabase
        .from("meetings")
        .upsert(
          {
            meeting_uuid,
            rtms_stream_id,
            server_urls: Array.isArray(server_urls) ? server_urls.join(",") : server_urls,
            host_id: operator_id,
            host_name: hostName,
            topic: meetingTopic,
            status: "active",
            started_at: new Date().toISOString(),
          },
          { onConflict: "meeting_uuid" }
        )
        .select();

      if (error) {
        console.error("Error storing meeting:", error);
        return new Response(
          JSON.stringify({ error: "Failed to store meeting" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      await supabase.from("media_events").insert({
        meeting_id: data?.[0]?.id,
        event_type: "rtms",
        action: "stream_started",
        metadata: { server_urls, rtms_stream_id },
      });

      return new Response(
        JSON.stringify({ success: true, meeting: data?.[0] }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event === "meeting.rtms_stopped") {
      const { meeting_uuid } = payload;

      const { data, error } = await supabase
        .from("meetings")
        .update({
          status: "ended",
          ended_at: new Date().toISOString(),
        })
        .eq("meeting_uuid", meeting_uuid)
        .select();

      if (error) {
        console.error("Error updating meeting:", error);
      }

      if (data?.[0]?.id) {
        await supabase
          .from("participants")
          .update({ is_active: false, left_at: new Date().toISOString() })
          .eq("meeting_id", data[0].id)
          .eq("is_active", true);

        await supabase.from("media_events").insert({
          meeting_id: data[0].id,
          event_type: "rtms",
          action: "stream_stopped",
          metadata: { meeting_uuid },
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event === "meeting.participant_joined") {
      const { meeting_uuid, participant } = payload;
      
      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (meeting) {
        await supabase.from("participants").upsert(
          {
            meeting_id: meeting.id,
            participant_id: participant?.participant_id || participant?.user_id,
            user_name: participant?.user_name,
            email: participant?.email,
            role: participant?.role || "participant",
            is_active: true,
            joined_at: new Date().toISOString(),
          },
          { onConflict: "meeting_id,participant_id" }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (event === "meeting.participant_left") {
      const { meeting_uuid, participant } = payload;
      
      const { data: meeting } = await supabase
        .from("meetings")
        .select("id")
        .eq("meeting_uuid", meeting_uuid)
        .maybeSingle();

      if (meeting) {
        await supabase
          .from("participants")
          .update({ is_active: false, left_at: new Date().toISOString() })
          .eq("meeting_id", meeting.id)
          .eq("participant_id", participant?.participant_id || participant?.user_id);
      }

      return new Response(
        JSON.stringify({ success: true }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ received: true, event }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});