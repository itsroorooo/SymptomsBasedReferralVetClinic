"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export async function login(formData) {
  const supabase = await createSupabaseServerClient();

  const email = formData.get("email");
  const password = formData.get("password");

  if (!email)
    return { error: { message: "Email is required", field: "email" } };
  if (!password)
    return { error: { message: "Password is required", field: "password" } };

  // Step 1: Sign in using Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData?.user) {
    return {
      error: { message: "Incorrect email or password", field: "general" },
    };
  }

  const userId = authData.user.id;

  // Step 2: Fetch user role from users table
  const { data: roleData, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  if (roleError || !roleData?.role) {
    return {
      error: {
        message: "User role not found. Contact admin.",
        field: "general",
      },
    };
  }

  const role = roleData.role;

  // Step 3: Redirect based on role
  revalidatePath("/", "layout");

  if (role === "admin") {
    redirect("/admin");
  } else if (role === "veterinary") {
    redirect("/clinic");
  } else if (role === "pet_owner") {
    redirect("/user");
  } else {
    redirect("/");
  }
}