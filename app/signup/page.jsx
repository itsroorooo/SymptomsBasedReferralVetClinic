"use client";

import { useState } from "react";
import Image from "next/image";
import { signup } from "./actions";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOAuthSignup = async (provider) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error) {
      console.error("OAuth signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    // Validation
    let isValid = true;

    if (!email) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      isValid = false;
    }

    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      await signup(formData);
    } catch (error) {
      console.error("Signup error:", error);
      if (error.message.includes("User already registered")) {
        setEmailError("Email already in use");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg p-6 h-auto relative">
        <div className="bg-white w-full p-4 sm:p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-blue-500">
              Create Your Account
            </h3>
          </div>

          <form className="flex flex-col mt-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="mb-2">
              <label htmlFor="email" className="block text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder=""
                aria-label="Email Address"
              />
              {emailError && (
                <div className="text-red-500 text-sm mt-1">{emailError}</div>
              )}
            </div>

            {/* Password Input */}
            <div className="mb-2">
              <label htmlFor="password" className="block text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  passwordError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder=""
                aria-label="Password"
              />
              {passwordError && (
                <div className="text-red-500 text-sm mt-1">{passwordError}</div>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label
                htmlFor="confirmPassword"
                className="block text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className={`w-full px-4 py-2 border rounded-md focus:outline-none ${
                  confirmPasswordError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder=""
                aria-label="Confirm Password"
              />
              {confirmPasswordError && (
                <div className="text-red-500 text-sm mt-1">
                  {confirmPasswordError}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              formAction={signup}
              type="submit"
              className="w-full py-2 rounded-md text-white bg-blue-600 hover:bg-black text-sm sm:text-lg font-semibold shadow-md transition duration-300 flex justify-center items-center"
              disabled={loading}
              aria-label="Sign Up"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Sign Up"
              )}
            </button>

            {/* OAuth Signup Buttons */}
            <div className="flex items-center justify-center my-4">
              <hr className="w-full border-gray-300" />
              <span className="mx-2 text-gray-500 font-medium">or</span>
              <hr className="w-full border-gray-300" />
            </div>

            <button
              type="button"
              onClick={() => handleOAuthSignup("google")}
              className="w-full flex items-center justify-center py-2 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-gray-900 hover:text-white"
              aria-label="Continue with Google"
            >
              <Image
                src="/image/google.png"
                width={20}
                height={20}
                alt="Google Logo"
                className="mr-2"
              />
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuthSignup("facebook")}
              className="w-full flex items-center justify-center py-2 mt-3 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-gray-900 hover:text-white"
              aria-label="Continue with Facebook"
            >
              <Image
                src="/image/facebook.png"
                width={20}
                height={20}
                alt="Facebook Logo"
                className="mr-2"
              />
              Continue with Facebook
            </button>

            {/* Login Link */}
            <p className="text-gray-800 text-xs sm:text-sm text-center mt-4">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Login
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
