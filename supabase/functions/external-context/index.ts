import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

function chunkText(text: string, maxChunkSize = 2000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const id = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    if (req.method === "GET") {
      let query = supabase.from("external_contexts").select("id, title, file_name, file_type, chunk_index, metadata, created_at");

      if (id && id !== "external-context") {
        query = query.eq("id", id);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const grouped = data.reduce((acc: Record<string, unknown>, item) => {
        const key = item.file_name;
        if (!acc[key]) {
          acc[key] = { ...item, chunk_count: 1 };
        } else {
          (acc[key] as { chunk_count: number }).chunk_count++;
        }
        return acc;
      }, {});

      return new Response(JSON.stringify({ data: Object.values(grouped) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      let title: string;
      let fileName: string;
      let fileType: string;
      let content: string;

      if (contentType.includes("multipart/form-data")) {
        const formData = await req.formData();
        const file = formData.get("file") as File;
        title = (formData.get("title") as string) || file.name;
        fileName = file.name;

        const ext = fileName.split(".").pop()?.toLowerCase() || "";
        if (ext === "pdf") {
          fileType = "pdf";
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let text = "";
          for (let i = 0; i < bytes.length; i++) {
            if (bytes[i] >= 32 && bytes[i] <= 126) {
              text += String.fromCharCode(bytes[i]);
            } else if (bytes[i] === 10 || bytes[i] === 13) {
              text += "\n";
            }
          }
          content = text.replace(/\s+/g, " ").trim();
          if (content.length < 100) {
            content = `[PDF Document: ${fileName}] This PDF could not be fully parsed. Please ensure it contains selectable text.`;
          }
        } else if (ext === "docx") {
          fileType = "docx";
          const arrayBuffer = await file.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let text = "";
          let inTag = false;
          for (let i = 0; i < bytes.length; i++) {
            const char = String.fromCharCode(bytes[i]);
            if (char === "<") inTag = true;
            else if (char === ">") inTag = false;
            else if (!inTag && bytes[i] >= 32 && bytes[i] <= 126) text += char;
          }
          content = text.replace(/\s+/g, " ").trim();
          if (content.length < 100) {
            content = `[DOCX Document: ${fileName}] Document content extracted.`;
          }
        } else {
          fileType = "txt";
          content = await file.text();
        }
      } else {
        const body = await req.json();
        title = body.title;
        fileName = body.file_name;
        fileType = body.file_type || "txt";
        content = body.content;
      }

      const chunks = chunkText(content);
      const insertData = chunks.map((chunk, index) => ({
        title,
        file_name: fileName,
        file_type: fileType,
        content: chunk,
        chunk_index: index,
        metadata: { total_chunks: chunks.length },
      }));

      const { data, error } = await supabase
        .from("external_contexts")
        .insert(insertData)
        .select();

      if (error) throw error;

      return new Response(JSON.stringify({ data: data[0], chunks_created: chunks.length }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "DELETE") {
      const fileName = url.searchParams.get("file_name");

      if (id && id !== "external-context") {
        const { error } = await supabase.from("external_contexts").delete().eq("id", id);
        if (error) throw error;
      } else if (fileName) {
        const { error } = await supabase.from("external_contexts").delete().eq("file_name", fileName);
        if (error) throw error;
      } else {
        return new Response(JSON.stringify({ error: "ID or file_name required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("External context error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});