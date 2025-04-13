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

  if (!data.email)
    return { error: { message: "Email is required", field: "email" } };
  if (!data.password)
    return { error: { message: "Password is required", field: "password" } };

  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword(
      data
    );

    if (error || !authData?.user) {
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

    const userId = authData.user.id;

    const { data: profile, error: profileError } = await supabase
      .from("users") // or your actual table name
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Role fetch error:", profileError);
      return {
        error: { message: "User role not found", field: "general" },
      };
    }

    const role = profile.role;

    revalidatePath("/", "layout");

    if (role === "user") {
      redirect("/user");
    } else if (role === "vet") {
      redirect("/vetclinic");
    } else if (role === "admin") {
      redirect("/admin");
    } else {
      redirect("/"); // fallback
    }
  } catch (error) {
    console.error("Login error:", error);
    return {
      error: { message: "Login failed. Please try again.", field: "general" },
    };
  }
}
