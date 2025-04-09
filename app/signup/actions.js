"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData) {
  const supabase = await createClient();

  // Verify client initialization
  if (!supabase?.auth) {
    throw new Error("Supabase auth module not available");
  }

  try {
    // Extract form data
    const email = formData.get("email");
    const password = formData.get("password");
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) throw authError;

    // 2. Insert into users table (matches your schema)
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: email,
      //  password_hash: "", // Supabase handles auth separately
      first_name: firstName,
      last_name: lastName,
      role: "pet_owner", // Default role
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (userError) throw userError;

    // 3. Create pet owner profile (matches your schema)
    const { error: profileError } = await supabase
      .from("pet_owner_profiles")
      .insert({
        id: authData.user.id,
        first_name: firstName,
        last_name: lastName,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) throw profileError;

    revalidatePath("/", "layout");
    return redirect("/login");
  } catch (error) {
    console.error("Signup error:", error);

    // Handle specific errors
    if (error.message.includes("User already registered")) {
      throw new Error("Email already in use");
    }

    if (error.code === "23505") {
      // Unique violation
      throw new Error("User already exists in database");
    }
  }
}
