"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function signup(formData) {
  const supabase = await createSupabaseServerClient();

  if (!supabase?.auth) {
    return { 
      success: false,
      error: "auth", 
      message: "Authentication service unavailable" 
    };
  }

  const email = formData.get("email");
  const password = formData.get("password");
  const first_name = formData.get("firstName");
  const last_name = formData.get("lastName");

  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name, last_name },
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
      is_active: false,
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
      });

    if (profileError) throw profileError;

    revalidatePath("/", "layout");
    
    return { 
      success: true,
      email,
      redirectUrl: `/verify-email?email=${encodeURIComponent(email)}`
    };
    
  } catch (error) {
    console.error("Signup error:", error);

    // Cleanup partial user if exists
    if (email) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
      
      if (user?.id) {
        await supabase.from('users').delete().eq('id', user.id);
        await supabase.from('pet_owner_profiles').delete().eq('id', user.id);
      }
    }

    if (error.message.includes("User already registered") || error.code === "23505") {
      return {
        success: false,
        error: "email",
        message: "Email already in use"
      };
    }

    return {
      success: false,
      error: "general",
      message: error.message || "Account creation failed. Please try again."
    };
  }
}