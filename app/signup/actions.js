"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(formData) {
<<<<<<< Updated upstream
  const supabase = await createClient();

  // Data validation
  const email = formData.get("email")?.toString().trim();
  const password = formData.get("password")?.toString();
  const firstName = formData.get("first_name")?.toString().trim();
  const lastName = formData.get("last_name")?.toString().trim();

  if (!email || !password || !firstName || !lastName) {
    return { error: "All fields are required" };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
=======
  const supabase = createClient();

  // Verify client initialization
  if (!supabase?.auth) {
    throw new Error("Supabase auth module not available");
  }

  try {
    // Step 1: Create a user in the Supabase authentication system
    const { data, error } = await supabase.auth.signUp({
      email: formData.get("email"),
      password: formData.get("password"),
      options: {
        data: {
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
        },
      },
    });

    if (error) throw error;

    // Step 2: Insert a record into the `pet_owner_profiles` table
    if (data?.user) {
      const { error: profileError } = await supabase
        .from("pet_owner_profiles")
        .insert({
          user_id: data.user.id, // Link to the `users` table
          first_name: formData.get("firstName"),
          last_name: formData.get("lastName"),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Error inserting into pet_owner_profiles:", profileError);
        throw profileError;
      }
    }

    // Step 3: Redirect to the homepage or another page
    revalidatePath("/", "layout");
    return redirect("/");
  } catch (error) {
    console.error("Signup error:", error);
>>>>>>> Stashed changes
    if (error.message.includes("User already registered")) {
      // Check if user exists but hasn't verified email
      const {
        data: { users },
        error: lookupError,
      } = await supabase.auth.admin.listUsers();
      const userExists = users?.some(
        (user) => user.email === email && user.email_confirmed_at === null
      );

      if (userExists) {
        return {
          error:
            "Email already registered but not verified. Check your email or request a new verification link.",
        };
      }
      return { error: "Email already in use. Please login instead." };
    }
    return { error: error.message };
  }

  if (data.user && !data.user.identities?.length) {
    return { error: "User already registered with another method" };
  }

  redirect("/verify-email?email=" + encodeURIComponent(email));
}
