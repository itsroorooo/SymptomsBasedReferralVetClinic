"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData) {
  const supabase = createClient();
  
  // Verify client initialization
  if (!supabase?.auth) {
    throw new Error("Supabase auth module not available");
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: formData.get("email"),
      password: formData.get("password"),
      options: {
        data: {
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
        }
      }
    });

    if (error) throw error;

    // Store additional user data in public table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: data.user.id,
          email: data.user.email,
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error("Profile update failed:", profileError);
      }
    }

    revalidatePath("/", "layout");
    return redirect("/");
  } catch (error) {
    console.error("Signup error:", error);
    if (error.message.includes("User already registered")) {
      throw new Error("Email already in use");
    }
    throw error;
  }
}