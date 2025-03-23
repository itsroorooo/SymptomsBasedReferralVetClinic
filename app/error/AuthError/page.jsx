// src/app/errors/auth-errors.js
import { createClient } from "@/utils/supabase/client";

export const handleLoginErrors = async (email, password) => {
  const supabase = createClient();
  let emailError = "";
  let passwordError = "";

  // Check for empty fields
  if (!email) emailError = "Email is required";
  if (!password) passwordError = "Password is required";
  if (emailError || passwordError) return { emailError, passwordError };

  try {
    // Attempt login
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Check if email exists
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("email", email)
        .single();

      if (userError || !userData) {
        emailError = "Email not found";
      } else {
        passwordError = "Incorrect password";
      }
    }

    return { emailError, passwordError };
  } catch (error) {
    console.error("Login error:", error);
    return {
      emailError: "",
      passwordError: "An unexpected error occurred",
    };
  }
};
