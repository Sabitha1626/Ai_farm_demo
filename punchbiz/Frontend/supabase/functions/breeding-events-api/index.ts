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

    if (req.method === "GET") {
      const cow_id = url.searchParams.get("cow_id");
      const user_id = url.searchParams.get("user_id");
      const event_type = url.searchParams.get("event_type");
      const status = url.searchParams.get("status");
      const from_date = url.searchParams.get("from_date");
      const to_date = url.searchParams.get("to_date");

      let query = supabase.from("breeding_events").select("*").order("event_date", { ascending: true });
      
      if (cow_id) query = query.eq("cow_id", cow_id);
      if (user_id) query = query.eq("user_id", user_id);
      if (event_type) query = query.eq("event_type", event_type);
      if (status) query = query.eq("status", status);
      if (from_date) query = query.gte("event_date", from_date);
      if (to_date) query = query.lte("event_date", to_date);

      const { data, error } = await query;
      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, events: data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { cow_id, user_id, event_type, title, description, event_date, end_date, reminder_date, notes, status } = body;

      if (!cow_id || !user_id || !event_type || !title || !event_date) {
        return new Response(
          JSON.stringify({ error: "Missing required fields: cow_id, user_id, event_type, title, event_date" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Creating breeding event for cow ${cow_id}: ${event_type}`);

      const { data: event, error } = await supabase
        .from("breeding_events")
        .insert({
          cow_id,
          user_id,
          event_type,
          title,
          description: description || null,
          event_date,
          end_date: end_date || null,
          reminder_date: reminder_date || null,
          notes: notes || null,
          status: status || "scheduled",
        })
        .select()
        .single();

      if (error) throw error;

      // Update cow status based on event type
      let cowStatus = null;
      if (event_type === "insemination") cowStatus = "inseminated";
      else if (event_type === "pregnancy_confirmed") cowStatus = "pregnant";
      else if (event_type === "calving") cowStatus = "lactating";
      
      if (cowStatus) {
        await supabase
          .from("cows")
          .update({ status: cowStatus, updated_at: new Date().toISOString() })
          .eq("id", cow_id);
      }

      return new Response(
        JSON.stringify({ success: true, event }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const { id, ...updates } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing event id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: event, error } = await supabase
        .from("breeding_events")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, event }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id");
      
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Missing event id" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("breeding_events")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: "Event deleted" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Breeding events API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
