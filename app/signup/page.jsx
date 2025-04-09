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
  const [first_nameError, setFirst_nameError] = useState("");
  const [last_nameError, setLast_nameError] = useState("");

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
    const first_name = formData.get("first_name");
    const last_name = formData.get("last_name");
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
      const { error } = await signup(formData);
      if (error) {
        setEmailError(error);
      }
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Image on the left side - full height */}
      <div className="sm:hidden md:block md:w-1/2  bg-blue-500 flex flex-col items-center justify-center rounded-b-full">
        <div className="text-center p-8 mt-72">
          <p className="text-2xl  text-white mt-4">
            Your account helps us care for them like you do
          </p>
        </div>
        <Image
          src="/image/dmpets.png"
          width={1000}
          height={1000}
          alt="SymptoVet Logo"
          className="w-130 h-auto ml-58"
        />
      </div>
      {/* Sign Form - Right side */}
      <div className="w-full md:w-1/2 bg-white relative">
        {/* Logo and text in top-right corner */}
        <div className="md:left-8 absolute top-8 left-14 flex items-center">
          <Image
            src="/image/Logoblue.png"
            width={60}
            height={60}
            alt="SymptoVet Logo"
            className="w-16 h-auto"
          />
          <span className="md:text-2xl text-3xl font-bold ml-2">
            <span className="text-black">Sympto</span>
            <span className="text-blue-500">Vet</span>
          </span>
        </div>

        <div className="flex items-center justify-center h-full p-6 md:p-12">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h3 className="lg:text-5xl sm:text-4xl md:text-4xl font-bold text-blue-600 mt-10">
                Create an Account
              </h3>
              <p className="text-gray-600 mt-2">
                Your pet’s health journey starts here, create an account to
                continue
              </p>
            </div>

            <form className="flex flex-col mt-6" onSubmit={handleSubmit}>
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* First Name */}
                <div className="relative">
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                      first_nameError ? "border-red-500" : ""
                    }`}
                    placeholder=" "
                    aria-label="First Name"
                  />
                  <label
                    htmlFor="first_name"
                    className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    First Name
                  </label>
                  {first_nameError && (
                    <div className="text-red-500 text-sm mt-1">
                      {first_nameError}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="relative">
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                      last_nameError ? "border-red-500" : ""
                    }`}
                    placeholder=" "
                    aria-label="Last Name"
                  />
                  <label
                    htmlFor="last_name"
                    className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Last Name
                  </label>
                  {last_nameError && (
                    <div className="text-red-500 text-sm mt-1">
                      {last_nameError}
                    </div>
                  )}
                </div>
              </div>

              {/* Email Input */}
              <div className="relative mb-6">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                    emailError ? "border-red-500" : ""
                  }`}
                  placeholder=" "
                  aria-label="Email Address"
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
                  className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                    passwordError ? "border-red-500" : ""
                  }`}
                  placeholder=" "
                  aria-label="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                >
                  Password
                </label>
                {passwordError && (
                  <div className="text-red-500 text-sm mt-1">
                    {passwordError}
                  </div>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="relative mb-6">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                    confirmPasswordError ? "border-red-500" : ""
                  }`}
                  placeholder=" "
                  aria-label="Confirm Password"
                />
                <label
                  htmlFor="confirmPassword"
                  className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                >
                  Confirm Password
                </label>
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
                className="w-full py-3 rounded-md text-white bg-blue-600 hover:bg-blue-900 text-sm sm:text-lg font-semibold shadow-md transition duration-300 flex justify-center items-center"
                disabled={loading}
                aria-label="Sign Up"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Get Started"
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
                onClick={() => handleOAuthSignup("facebook")}
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
    </div>
  );
}
