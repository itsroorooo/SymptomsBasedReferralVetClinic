"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  // Basic validation
  if (!data.email)
    return { error: { message: "Email is required", field: "email" } };
  if (!data.password)
    return { error: { message: "Password is required", field: "password" } };

  try {
    const { error } = await supabase.auth.signInWithPassword(data);

    if (error) {
      // Check auth.users table directly for email existence
      const { data: authUser, error: authError } = await supabase
        .from("auth.users")
        .select("email")
        .eq("email", data.email)
        .maybeSingle();

      if (authError || !authUser) {
        return { error: { message: "Email not found", field: "email" } };
      } else {
        return { error: { message: "Incorrect password", field: "password" } };
      }
    }

    revalidatePath("/", "layout");
    return { success: true }; // Let client handle redirect
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: { message: "Login failed. Please try again.", field: "general" },
    };
  }
}
