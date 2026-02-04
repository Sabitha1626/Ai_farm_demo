import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "create";

    if (req.method === "GET") {
      // Get health records for a cow or user
      const cow_id = url.searchParams.get("cow_id");
      const user_id = url.searchParams.get("user_id");
      const limit = parseInt(url.searchParams.get("limit") || "50");

      let query = supabase.from("health_records").select("*").order("record_date", { ascending: false }).limit(limit);
      
      if (cow_id) query = query.eq("cow_id", cow_id);
      if (user_id) query = query.eq("user_id", user_id);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, records: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { cow_id, user_id, record_type, diagnosis, treatment, medications, veterinarian, cost, notes, follow_up_date } = body;

      if (!cow_id || !user_id || !record_type) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: cow_id, user_id, record_type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Creating health record for cow ${cow_id}`);

      const { data: record, error } = await supabase
        .from("health_records")
        .insert({
          cow_id,
          user_id,
          record_type,
          diagnosis: diagnosis || null,
          treatment: treatment || null,
          medications: medications || null,
          veterinarian: veterinarian || null,
          cost: cost || null,
          notes: notes || null,
          follow_up_date: follow_up_date || null,
          record_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update cow status if it's a health issue
      if (record_type === "illness" || record_type === "injury") {
        await supabase
          .from("cows")
          .update({ status: "sick", updated_at: new Date().toISOString() })
          .eq("id", cow_id);
      }

      // If there's a follow-up, we could create a reminder/alert
      if (follow_up_date) {
        console.log(`Follow-up scheduled for ${follow_up_date}`);
      }

      return new Response(
        JSON.stringify({ success: true, record }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing record id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: record, error } = await supabase
        .from("health_records")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, record }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing record id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("health_records")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Record deleted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Health records API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
