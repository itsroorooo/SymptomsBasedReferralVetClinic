"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export async function signup(formData) {
  const supabase = await createClient();

  if (!supabase?.auth) {
    return { error: "auth", message: "Authentication service unavailable" };
  }

  // Extract form data
  const email = formData.get("email");
  const password = formData.get("password");
  const first_name = formData.get("firstName");
  const last_name = formData.get("lastName");

  // Wrap only the operations that can fail
  try {
    // 🔒 Hash password manually
    const passwordHash = await bcrypt.hash(password, 10);
  
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });
  
    if (authError) throw authError;
    if (!authData.user) throw new Error("User creation failed");
  
    // 2. Insert into users table
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      first_name,
      last_name,
      role: "pet_owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: false, // Mark inactive until verified
      password_hash: passwordHash,
    });
  
    if (userError) throw userError;
  
    // 3. Create pet owner profile
    const { error: profileError } = await supabase
      .from("pet_owner_profiles")
      .insert({
        id: authData.user.id,
        first_name,
        last_name,
        profile_picture_url: "/image/default-avatar.jpg",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  
    if (profileError) throw profileError;
  
    revalidatePath("/", "layout");
  
    // ✅ Redirect only after successful signup
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  } catch (error) {
    console.error("Signup error:", error);
  
    if (
      error.message.includes("User already registered") ||
      error.code === "23505"
    ) {
      return {
        error: "email",
        message: "Email already in use",
      };
    }
  
    return {
      error: "general",
      message: "Account creation failed. Please try again.",
    };
  }

  // ✅ Only call redirect after the try block
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}