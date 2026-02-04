import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { type, data } = body;

    // Validate request
    if (!type || !data) {
      return new Response(
        JSON.stringify({ error: "Missing 'type' or 'data' in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (type) {
      case "milk_production": {
        // Expected data: { cow_id, user_id, quantity_liters, sensor_id?, fat_percentage?, protein_percentage?, quality_grade? }
        const { cow_id, user_id, quantity_liters, sensor_id, fat_percentage, protein_percentage, quality_grade } = data;
        
        if (!cow_id || !user_id || quantity_liters === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: cow_id, user_id, quantity_liters" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: insertedData, error } = await supabase
          .from("milk_production")
          .insert({
            cow_id,
            user_id,
            quantity_liters,
            sensor_id: sensor_id || null,
            fat_percentage: fat_percentage || null,
            protein_percentage: protein_percentage || null,
            quality_grade: quality_grade || null,
            is_automatic: true,
            recorded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        result = { success: true, record: insertedData };
        break;
      }

      case "weight": {
        // Expected data: { cow_id, user_id, weight_kg, sensor_id? }
        const { cow_id, user_id, weight_kg, sensor_id } = data;
        
        if (!cow_id || !user_id || weight_kg === undefined) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: cow_id, user_id, weight_kg" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert weight reading
        const { data: weightData, error: weightError } = await supabase
          .from("weight_sensor_readings")
          .insert({
            cow_id,
            user_id,
            weight_kg,
            sensor_id: sensor_id || null,
            is_automatic: true,
            recorded_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (weightError) throw weightError;

        // Also update the cow's current weight
        const { error: updateError } = await supabase
          .from("cows")
          .update({ weight: weight_kg, updated_at: new Date().toISOString() })
          .eq("id", cow_id);

        if (updateError) throw updateError;

        result = { success: true, record: weightData };
        break;
      }

      case "biometric_attendance": {
        // Expected data: { staff_id, user_id, biometric_id, action: "check_in" | "check_out", location? }
        const { staff_id, user_id, biometric_id, action, location } = data;
        
        if (!staff_id || !user_id || !biometric_id || !action) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: staff_id, user_id, biometric_id, action" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (action === "check_in") {
          const { data: attendanceData, error } = await supabase
            .from("attendance_records")
            .insert({
              staff_id,
              user_id,
              biometric_id,
              biometric_type: "fingerprint",
              check_in: new Date().toISOString(),
              location: location || null,
              status: "present",
            })
            .select()
            .single();

          if (error) throw error;
          result = { success: true, record: attendanceData };
        } else if (action === "check_out") {
          // Find today's check-in record and update with check_out
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const { data: existingRecord, error: fetchError } = await supabase
            .from("attendance_records")
            .select("*")
            .eq("staff_id", staff_id)
            .gte("check_in", today.toISOString())
            .is("check_out", null)
            .order("check_in", { ascending: false })
            .limit(1)
            .single();

          if (fetchError) {
            return new Response(
              JSON.stringify({ error: "No check-in record found for today" }),
              { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }

          const { data: updatedData, error: updateError } = await supabase
            .from("attendance_records")
            .update({ check_out: new Date().toISOString() })
            .eq("id", existingRecord.id)
            .select()
            .single();

          if (updateError) throw updateError;
          result = { success: true, record: updatedData };
        }
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown type: ${type}. Valid types: milk_production, weight, biometric_attendance` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Sensor data error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
