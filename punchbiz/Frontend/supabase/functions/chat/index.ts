import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en', imageBase64, audioTranscript } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch farm data for context
    const authHeader = req.headers.get('Authorization');
    let farmContext = '';
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Fetch cows
        const { data: cows } = await supabase
          .from('cows')
          .select('*')
          .eq('user_id', user.id);
        
        // Fetch recent heat records
        const { data: heatRecords } = await supabase
          .from('heat_records')
          .select('*, cows(name, tag_number)')
          .eq('user_id', user.id)
          .order('detected_at', { ascending: false })
          .limit(10);
        
        // Fetch recent health records
        const { data: healthRecords } = await supabase
          .from('health_records')
          .select('*, cows(name, tag_number)')
          .eq('user_id', user.id)
          .order('record_date', { ascending: false })
          .limit(10);
        
        // Fetch breeding events
        const { data: breedingEvents } = await supabase
          .from('breeding_events')
          .select('*, cows(name, tag_number)')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false })
          .limit(10);
        
        // Fetch milk production
        const { data: milkProduction } = await supabase
          .from('milk_production')
          .select('*, cows(name, tag_number)')
          .eq('user_id', user.id)
          .order('recorded_at', { ascending: false })
          .limit(20);
        
        // Fetch staff
        const { data: staff } = await supabase
          .from('staff')
          .select('*')
          .eq('user_id', user.id);

        // Build context
        farmContext = `
**Current Farm Data:**

**Herd (${cows?.length || 0} cows):**
${cows?.map(c => `- ${c.name} (Tag: ${c.tag_number}, Breed: ${c.breed || 'Unknown'}, Status: ${c.status || 'Active'})`).join('\n') || 'No cows registered'}

**Recent Heat Detections:**
${heatRecords?.map(h => `- ${h.cows?.name} (${h.cows?.tag_number}): ${h.intensity || 'Unknown'} intensity on ${new Date(h.detected_at).toLocaleDateString()}, AI Confidence: ${h.ai_confidence ? (h.ai_confidence * 100).toFixed(0) + '%' : 'N/A'}`).join('\n') || 'No recent heat detections'}

**Recent Health Records:**
${healthRecords?.map(h => `- ${h.cows?.name}: ${h.record_type} on ${new Date(h.record_date).toLocaleDateString()} - ${h.diagnosis || h.treatment || 'No details'}`).join('\n') || 'No health records'}

**Upcoming Breeding Events:**
${breedingEvents?.filter(e => new Date(e.event_date) >= new Date()).map(e => `- ${e.cows?.name}: ${e.event_type} scheduled for ${new Date(e.event_date).toLocaleDateString()}`).join('\n') || 'No upcoming events'}

**Recent Milk Production:**
${milkProduction?.slice(0, 5).map(m => `- ${m.cows?.name}: ${m.quantity_liters}L on ${new Date(m.recorded_at).toLocaleDateString()}`).join('\n') || 'No milk production data'}

**Staff (${staff?.length || 0} members):**
${staff?.map(s => `- ${s.name} (${s.role || 'Staff'}) - ${s.is_absent ? 'Absent' : 'Present'}`).join('\n') || 'No staff registered'}
`;
      }
    }

    // Language-specific instructions
    const languageInstructions: Record<string, string> = {
      en: 'Respond in English.',
      es: 'Responde en español.',
      fr: 'Réponds en français.',
      sw: 'Jibu kwa Kiswahili.',
      ta: 'தமிழில் பதிலளிக்கவும்.',
      hi: 'हिंदी में जवाब दें।',
    };

    // Build the user message content
    let userMessageContent = messages[messages.length - 1]?.content || '';
    
    if (audioTranscript) {
      userMessageContent = `[Voice message transcribed]: ${audioTranscript}\n\n${userMessageContent}`;
    }

    // Handle image analysis
    let imageAnalysis = '';
    if (imageBase64) {
      // Use Gemini for image analysis
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this image of cattle/farm. Describe what you see, identify any health issues, breeding signs, or other relevant observations for a farm assistant. Be specific about any cattle visible."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: imageBase64
                  }
                }
              ]
            }
          ],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageAnalysis = imageData.choices?.[0]?.message?.content || '';
        userMessageContent = `[Image Analysis]: ${imageAnalysis}\n\nUser's question: ${userMessageContent}`;
      }
    }

    // Update messages with enhanced content
    const enhancedMessages = [...messages];
    if (enhancedMessages.length > 0) {
      enhancedMessages[enhancedMessages.length - 1] = {
        ...enhancedMessages[enhancedMessages.length - 1],
        content: userMessageContent
      };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are AI Farm Assistant, an expert AI specialized in comprehensive farm management and cattle breeding. ${languageInstructions[language] || languageInstructions.en}

**Your Capabilities:**
- Heat Detection & Breeding: Interpret sensor data, recommend optimal breeding timing
- Cattle Health & Nutrition: Monitor health, plan nutrition, track vaccinations
- Farm Operations: Staff management, inventory, equipment maintenance
- Breeding & Genetics: Genetic selection, pregnancy monitoring, record keeping

${farmContext}

**Guidelines:**
- Be helpful, practical, and provide actionable advice
- Use the farm data above to give personalized recommendations
- When discussing specific cows, reference them by name and tag number
- Alert about any urgent matters (cows in heat, health issues, low stock)
- Keep responses concise but informative
- If analyzing an image, provide detailed observations about the cattle
- For voice messages, acknowledge that it was a voice input and respond naturally`
          },
          ...enhancedMessages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

    return new Response(JSON.stringify({ content, imageAnalysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Chat error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
