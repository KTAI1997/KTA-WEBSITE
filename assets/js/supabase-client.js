// Public browser client for K.T.A International.
// Publishable keys are designed for browser use; database access is protected by RLS.
// NEVER place a Supabase secret/service-role key in this file.
(function () {
  const SUPABASE_URL = "https://aprljdufrfvgvetxfttd.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_u57QTveknk3uV9eMjRRoRw_QUtXURe7";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    console.error("Supabase SDK did not load. Check the CDN connection.");
    window.ktaSupabase = null;
    return;
  }

  window.ktaSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    }
  );
  window.ktaSupabaseConfigured = true;
})();
