"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import bcrypt from "bcryptjs";

export async function login(formData) {
  const supabase = await createSupabaseServerClient();

  const email = formData.get("email");
  const password = formData.get("password");

  if (!email)
    return { error: { message: "Email is required", field: "email" } };
  if (!password)
    return { error: { message: "Password is required", field: "password" } };

  // Veterinary login
  const { data: vetUser } = await supabase
    .from("users")
    .select("id, role, password_hash")
    .eq("email", email)
    .eq("role", "veterinary")
    .maybeSingle();

  if (vetUser) {
    const isMatch = await bcrypt.compare(password, vetUser.password_hash);
    if (!isMatch) {
      return { error: { message: "Incorrect password", field: "password" } };
    }

    // ✅ This throws a redirect signal — no need to return anything
    revalidatePath("/", "layout");
    redirect("/clinic");
  }

  // Supabase Auth login (pet_owner & admin)
  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData?.user) {
    return { error: { message: "Incorrect credentials", field: "general" } };
  }

  const { data: roleProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  const role = roleProfile?.role;

  revalidatePath("/", "layout");

  if (role === "pet_owner") {
    redirect("/user");
  } else if (role === "admin") {
    redirect("/admin");
  } else if (role === "veterinary") {
    redirect("/clinic"); 
  } else {
    redirect("/");
  }
}
