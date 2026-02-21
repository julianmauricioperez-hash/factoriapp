import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Available models
const AVAILABLE_MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3-pro-preview",
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "openai/gpt-5",
  "openai/gpt-5-mini",
  "openai/gpt-5.2",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { messages, model, searchMode } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Se requiere un array de mensajes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate model or use default
    const selectedModel = AVAILABLE_MODELS.includes(model) 
      ? model 
      : "google/gemini-3-flash-preview";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Process messages to handle multimodal content
    const processedMessages = messages.map((msg: any) => {
      if (Array.isArray(msg.content)) {
        return msg;
      }
      return msg;
    });

    // Choose system prompt based on search mode
    const systemPrompt = searchMode
      ? `Eres un motor de búsqueda inteligente con IA. Tu objetivo es proporcionar respuestas informativas, actualizadas y bien estructuradas a las consultas del usuario.

INSTRUCCIONES DE BÚSQUEDA:
1. Responde SIEMPRE en español de forma clara y detallada.
2. Estructura tus respuestas con encabezados, listas y secciones claras usando Markdown.
3. Incluye datos específicos, fechas, cifras y hechos relevantes cuando sea posible.
4. Si la pregunta es sobre un tema actual, proporciona la información más reciente que conozcas e indica claramente hasta cuándo llega tu conocimiento.
5. Cita fuentes o referencias cuando sea apropiado (nombres de sitios, organizaciones, estudios).
6. Si no estás seguro de algo, indícalo claramente en lugar de inventar información.
7. Ofrece múltiples perspectivas cuando el tema sea debatible o complejo.
8. Al final de tu respuesta, sugiere búsquedas relacionadas que podrían interesar al usuario.
9. Usa emojis relevantes para hacer la respuesta más visual y organizada.
10. Para temas técnicos, incluye ejemplos de código si es pertinente.

FORMATO DE RESPUESTA:
- Usa "## " para títulos principales
- Usa "### " para subtítulos
- Usa listas con viñetas o numeradas
- Incluye una sección "🔍 Búsquedas relacionadas" al final con 3-5 sugerencias`
      : "Eres un asistente de IA amigable y útil. Respondes siempre en español de forma clara y concisa. Ayudas a los usuarios a probar y mejorar sus prompts. Puedes analizar imágenes cuando se te envían.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          ...processedMessages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados. Añade más créditos en configuración." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Error al comunicarse con el servicio de IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
