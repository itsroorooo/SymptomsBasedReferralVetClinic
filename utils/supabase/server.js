"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = cookies(); // ✅ Await is NOT needed here, as it returns an object

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async get(name) {
          return (await cookieStore).get(name)?.value; // ✅ Await added here
        },
        async getAll() {
          return (await cookieStore).getAll(); // ✅ Await added here
        },
        async set(name, value, options) {
          try {
            (await cookieStore).set(name, value, options); // ✅ Await added here
          } catch (error) {
            console.error("Error setting cookie:", error);
          }
        },
        async remove(name, options) {
          try {
            (await cookieStore).set(name, "", { ...options }); // ✅ Await added here
          } catch (error) {
            console.error("Error removing cookie:", error);
          }
        },
      },
    }
  );
}
