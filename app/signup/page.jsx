"use client";

import { useState } from "react";
import Image from "next/image";
import { signup } from "./actions";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

function SignupForm() {
  const router = useRouter();
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [formError, setFormError] = useState("");
  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleOAuthSignup = async (provider) => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error) {
      console.error("OAuth signup error:", error);
      setFormError(error.message || "Failed to sign in with provider");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    // Check if reCAPTCHA is available
    if (!executeRecaptcha) {
      setFormError("Security verification failed. Please refresh the page.");
      return;
    }

    const formData = new FormData(event.target);
    const first_name = formData.get("firstName");
    const last_name = formData.get("lastName");
    const email = formData.get("email");
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    // Reset errors
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setFirstNameError("");
    setLastNameError("");

    // Validation
    let isValid = true;

    if (!first_name) {
      setFirstNameError("First name is required");
      isValid = false;
    }

    if (!last_name) {
      setLastNameError("Last name is required");
      isValid = false;
    }

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
      // Get reCAPTCHA token
      const token = await executeRecaptcha("signup");

      // Create new FormData without confirmPassword
      const submissionData = new FormData();
      submissionData.append("firstName", first_name);
      submissionData.append("lastName", last_name);
      submissionData.append("email", email);
      submissionData.append("password", password);
      submissionData.append("recaptchaToken", token);

      const result = await signup(submissionData);

      if (result?.error) {
        // Handle specific errors
        if (result.error === "email") {
          setEmailError(result.message);
        } else {
          setFormError(result.message || "An error occurred during signup");
        }
      } else if (result?.success) {
        // Redirect to verification page on success
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      console.error("Signup error:", error);
      setFormError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Image on the left side - hidden on small screens */}
      <div className="hidden lg:block lg:w-1/2 bg-blue-500 flex flex-col items-center justify-center rounded-b-full">
        <div className="text-center p-8 lg:mt-18">
          <p className="text-2xl text-white mt-4">
            Your account helps us care for them like you do
          </p>
        </div>
        <Image
          src="/image/dmpets.png"
          width={1000}
          height={1000}
          alt="SymptoVet Logo"
          className="w-130 h-auto lg:ml-20"
        />
      </div>

      {/* Sign Form - Takes full width on small screens, half on larger */}
      <div className="w-full lg:w-1/2 bg-white relative">
        {/* Logo and text in top-right corner */}
        <div className="absolute top-4 left-4 md:left-8 md:top-8 flex items-center">
          <Image
            src="/image/logo_blue.png"
            width={60}
            height={60}
            alt="SymptoVet Logo"
            className="w-12 h-auto md:w-16"
          />
          <span className="text-xl lg:text-2xl font-bold ml-2">
            <span className="text-black">Sympto</span>
            <span className="text-blue-500">Vet</span>
          </span>
        </div>

        <div className="flex items-center justify-center h-full pt-20 pb-6 px-6 lg:py-12 lg:px-12">
          <div className="w-full max-w-lg">
            <div className="text-center mt-4 lg:mt-0">
              <h3 className="text-3xl lg:text-4xl font-bold text-blue-600 md:mt-20">
                Create an Account
              </h3>
              <p className="text-gray-600 mt-2">
                Your pet's health journey starts here, create an account to
                continue
              </p>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {formError}
              </div>
            )}

            <form className="flex flex-col mt-6" onSubmit={handleSubmit}>
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* First Name */}
                <div className="relative">
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                      firstNameError ? "border-red-500" : ""
                    }`}
                    placeholder=" "
                    aria-label="First Name"
                  />
                  <label
                    htmlFor="firstName"
                    className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    First Name
                  </label>
                  {firstNameError && (
                    <div className="text-red-500 text-sm mt-1">
                      {firstNameError}
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="relative">
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className={`peer w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500 ${
                      lastNameError ? "border-red-500" : ""
                    }`}
                    placeholder=" "
                    aria-label="Last Name"
                  />
                  <label
                    htmlFor="lastName"
                    className="absolute left-2 -top-2.5 bg-white px-1 text-sm text-gray-500 transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-2 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-gray-600"
                  >
                    Last Name
                  </label>
                  {lastNameError && (
                    <div className="text-red-500 text-sm mt-1">
                      {lastNameError}
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
                disabled={loading}
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
                disabled={loading}
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

export default function SignupPage() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: "body",
      }}
    >
      <SignupForm />
    </GoogleReCaptchaProvider>
  );
}
