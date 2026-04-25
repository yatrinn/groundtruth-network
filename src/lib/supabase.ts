// Supabase clients.
//
// We expose two flavours:
//   * supabaseBrowser: anon key, safe to ship to the browser. Used by
//     pages and client components that subscribe to realtime updates.
//   * supabaseServer:  service-role key, NEVER ship to the browser.
//     Used inside API routes to bypass row level security when we
//     act as the platform (releasing payouts, marking expired tasks).

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabaseBrowser: SupabaseClient = createClient(url, anonKey, {
  auth: { persistSession: false },
});

// Service role client is created lazily so that public routes that
// only need the anon key never trigger a "missing service role" error
// during build time.
let _serviceClient: SupabaseClient | null = null;
export function supabaseServer(): SupabaseClient {
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for server-only operations. " +
        "Add it to .env.local — never expose it to the browser."
    );
  }
  if (!_serviceClient) {
    _serviceClient = createClient(url!, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }
  return _serviceClient;
}
