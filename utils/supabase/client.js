import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  if (typeof window === "undefined") return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true, 
        autoRefreshToken: true, 
        detectSessionInUrl: true, 
        storage: window.localStorage,
      },
    }
  );
}