import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { cow_id, user_id, sensor_type, sensor_reading, intensity, symptoms, ai_confidence } = body;

    if (!cow_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: cow_id, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing heat detection for cow ${cow_id}`);

    // Insert heat record
    const { data: heatRecord, error: heatError } = await supabase
      .from("heat_records")
      .insert({
        cow_id,
        user_id,
        sensor_type: sensor_type || "activity_sensor",
        sensor_reading: sensor_reading || null,
        intensity: intensity || "medium",
        symptoms: symptoms || [],
        ai_confidence: ai_confidence || null,
        detected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (heatError) throw heatError;

    // Calculate optimal breeding window (12-18 hours after heat detection)
    const detectedAt = new Date();
    const optimalStart = new Date(detectedAt.getTime() + 12 * 60 * 60 * 1000);
    const optimalEnd = new Date(detectedAt.getTime() + 18 * 60 * 60 * 1000);

    // Get cow info for alert
    const { data: cow } = await supabase
      .from("cows")
      .select("name, tag_number")
      .eq("id", cow_id)
      .single();

    // Create heat alert
    const severity = intensity === "high" ? "high" : intensity === "low" ? "low" : "medium";
    const { data: alert, error: alertError } = await supabase
      .from("heat_alerts")
      .insert({
        cow_id,
        user_id,
        heat_record_id: heatRecord.id,
        title: `Heat Detected: ${cow?.name || cow?.tag_number || "Cow"}`,
        message: `Heat detected with ${intensity || "medium"} intensity. Optimal breeding window: ${optimalStart.toLocaleString()} - ${optimalEnd.toLocaleString()}`,
        alert_type: "heat_detected",
        severity,
        sensor_type: sensor_type || null,
        sensor_reading: sensor_reading || null,
        optimal_breeding_start: optimalStart.toISOString(),
        optimal_breeding_end: optimalEnd.toISOString(),
      })
      .select()
      .single();

    if (alertError) throw alertError;

    // Update cow status
    await supabase
      .from("cows")
      .update({ status: "in_heat", updated_at: new Date().toISOString() })
      .eq("id", cow_id);

    console.log(`Heat detection completed for cow ${cow_id}, alert created: ${alert.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        heat_record: heatRecord, 
        alert,
        optimal_breeding_window: {
          start: optimalStart.toISOString(),
          end: optimalEnd.toISOString()
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Heat detection error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
