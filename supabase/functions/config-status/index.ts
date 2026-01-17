import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const clientId = Deno.env.get("ZOOM_CLIENT_ID");
    const clientSecret = Deno.env.get("ZOOM_CLIENT_SECRET");
    const webhookSecret = Deno.env.get("ZOOM_WEBHOOK_SECRET");

    const status = {
      clientIdConfigured: !!clientId && clientId.length > 0,
      clientSecretConfigured: !!clientSecret && clientSecret.length > 0,
      webhookSecretConfigured: !!webhookSecret && webhookSecret.length > 0,
    };

    return new Response(JSON.stringify(status), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Config status error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to check configuration status" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
