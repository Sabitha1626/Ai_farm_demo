import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
    const { user_id, title, message, type, data } = body;

    if (!user_id || !title || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending notification to user ${user_id}: ${title}`);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id)
      .eq("is_active", true);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No active push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: true, message: "No active subscriptions", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Note: For real push notifications, you'd need web-push library and VAPID keys
    // This is a placeholder that logs the notification
    // In production, integrate with Firebase Cloud Messaging or Web Push API
    
    const notificationPayload = {
      title,
      body: message,
      type: type || "general",
      data: data || {},
      timestamp: new Date().toISOString(),
    };

    console.log(`Notification payload:`, notificationPayload);
    console.log(`Would send to ${subscriptions.length} subscription(s)`);

    // For now, just log success - actual push implementation requires VAPID keys
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification queued",
        subscriptions_count: subscriptions.length,
        payload: notificationPayload
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Notification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
