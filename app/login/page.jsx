"use client";

import { useState } from "react";
import Image from "next/image";
import { login } from "./actions";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCheckboxChange = () => {
    setRememberMe(!rememberMe);
  };

  const handleOAuthLogin = async (provider) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error) {
      console.error("OAuth login error:", error);
      setPasswordError("OAuth login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setEmailError("");
    setPasswordError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.error) {
      if (result.error.field === "email") {
        setEmailError(result.error.message);
      } else if (result.error.field === "password") {
        setPasswordError(result.error.message);
      } else {
        setPasswordError(result.error.message);
      }
    } else if (result?.success) {
      window.location.href = "/"; // Client-side redirect
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-sm sm:max-w-md md:max-w-lg p-6 h-auto relative">
        <div className="bg-white w-full p-4 sm:p-6">
          <div className="text-center mb-4">
            <h3 className="text-xl sm:text-2xl font-bold text-blue-500">
              Welcome Back!
            </h3>
          </div>

          <form className="flex flex-col mt-6" onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="relative mb-6">
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`peer w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="email"
                className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
              >
                Email address
              </label>
              {emailError && (
                <div className="text-red-500 text-sm mt-1">{emailError}</div>
              )}
            </div>

            {/* Password Input */}
            <div className="relative mb-6">
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`peer w-full px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500 ${
                  passwordError ? "border-red-500" : "border-gray-300"
                }`}
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
              >
                Password
              </label>
              {passwordError && (
                <div className="text-red-500 text-sm mt-1">{passwordError}</div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                  aria-label="Remember Me"
                />
                Remember me
              </label>
              <a
                href="/forgot-password"
                className="text-blue-600 font-semibold hover:underline"
              >
                Forgot Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-md text-white bg-blue-600 hover:bg-blue-700 text-lg font-semibold shadow-md transition duration-300 flex justify-center items-center"
              disabled={loading}
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Login"
              )}
            </button>

            {/* OAuth Login Buttons */}
            <div className="flex items-center justify-center my-4">
              <hr className="w-full border-gray-300" />
              <span className="mx-2 text-gray-500 font-medium">or</span>
              <hr className="w-full border-gray-300" />
            </div>

            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              className="w-full flex items-center justify-center py-2.5 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-gray-50"
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
              onClick={() => handleOAuthLogin("facebook")}
              className="w-full flex items-center justify-center py-2.5 mt-3 rounded-lg bg-white border border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-gray-50"
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

            {/* Register Link */}
            <p className="text-gray-800 text-xs sm:text-sm text-center mt-4">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-blue-600 font-semibold hover:underline cursor-pointer"
              >
                Create
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
