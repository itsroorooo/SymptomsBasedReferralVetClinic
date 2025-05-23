"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { userRouter } from "next/navigation";
import { login } from "./actions";
import { createClient } from "@/utils/supabase/client";
import Loading from "../components/Loading";
import { Eye, EyeOff } from "lucide-react";
import {
  GoogleReCaptchaProvider,
  useGoogleReCaptcha,
} from "react-google-recaptcha-v3";

function LoginForm() {
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Typing animation states
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Customizable text array
  const phrases = ["Furmoms", "Furdads", "Furbabies", "PetLovers"];

  // Typing speed controls
  const typingSpeed = 100;
  const deletingSpeed = 50;
  const pauseBetweenPhrases = 1500;

  useEffect(() => {
    // Cursor blink effect
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    const currentPhrase = phrases[currentPhraseIndex];

    if (!isDeleting && currentIndex < currentPhrase.length) {
      // Typing forward
      const timeout = setTimeout(() => {
        setDisplayedText(currentPhrase.substring(0, currentIndex + 1));
        setCurrentIndex((prev) => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (isDeleting && currentIndex > 0) {
      // Deleting backward
      const timeout = setTimeout(() => {
        setDisplayedText(currentPhrase.substring(0, currentIndex - 1));
        setCurrentIndex((prev) => prev - 1);
      }, deletingSpeed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === currentPhrase.length) {
      // Finished typing - pause then start deleting
      if (!isDeleting) {
        const timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pauseBetweenPhrases);

        return () => clearTimeout(timeout);
      }
    } else if (currentIndex === 0 && isDeleting) {
      // Finished deleting - move to next phrase
      setIsDeleting(false);
      setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
    }
  }, [currentIndex, isDeleting, currentPhraseIndex]);

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

    if (!executeRecaptcha) {
      console.error("reCAPTCHA not available");
      setPasswordError("Security check failed. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const token = await executeRecaptcha("login");

      // Get the form element more reliably
      const formElement = event.target.closest("form");
      if (!formElement) {
        throw new Error("Form element not found");
      }

      const formData = new FormData(formElement);
      formData.append("recaptchaToken", token);

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
        window.location.href = "/user"; // Client-side redirect
        setIsNavigating(true);
      }
    } catch (error) {
      console.error("Form submission error:", error);
      setPasswordError(error.message || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {isNavigating && <Loading />}
      {/* Left side - hidden on mobile, shown on md screens and up */}
      <div className="hidden md:flex md:w-1/2 bg-blue-500 flex-col items-center justify-center rounded-b-full">
        <div className="text-center p-8 mt-20">
          <h1 className="text-5xl font-bold text-white">
            Hi there, <span className="text-yellow-300">{displayedText}</span>
            <span
              className={`inline-block w-2 h-10 bg-yellow-300 ml-1 ${
                showCursor ? "opacity-100" : "opacity-0"
              }`}
            ></span>
          </h1>
          <p className="text-xl text-white mt-4">
            If your pet acts off, a vet check could be their best hope!
          </p>
        </div>
        <Image
          src="/image/petlover.png"
          width={700}
          height={700}
          alt="SymptoVet Logo"
          className="w-130 h-auto ml-35"
          priority
        />
      </div>

      {/* Right side - full width on mobile, half width on md screens and up */}
      <div className="w-full md:w-1/2 bg-white relative">
        {/* Logo and text - adjusted positioning for mobile */}
        <div className="absolute top-4 left-4 md:left-8 md:top-8 flex items-center">
          <Image
            src="/image/logo_blue.png"
            width={60}
            height={60}
            alt="SymptoVet Logo"
            className="w-12 h-auto md:w-16"
          />
          <span className="text-2xl md:text-3xl font-bold ml-2">
            <span className="text-black">Sympto</span>
            <span className="text-blue-500">Vet</span>
          </span>
        </div>

        {/* Login form container - adjusted padding for mobile */}
        <div className="flex items-center justify-center h-full p-4 md:p-6">
          <div className="w-full max-w-md">
            <div className="text-center mb-6 md:mb-8">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 mt-16 md:mt-20">
                Welcome Back!
              </h3>
              <p className="text-gray-600 mt-2 text-sm md:text-base">
                Login to your account to continue
              </p>
            </div>
            <form className="flex flex-col mt-6" onSubmit={handleSubmit}>
              {/* Email Input */}
              <div className="relative mb-6">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`peer w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:border-blue-500 ${
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
                  type={showPassword ? "text" : "password"}
                  required
                  className={`peer w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:border-blue-500 ${
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

                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>

                {passwordError && (
                  <div className="text-red-500 text-sm mt-1">
                    {passwordError}
                  </div>
                )}
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex justify-between items-center mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 accent-blue-600 rounded mr-2"
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
                className="w-full py-3 rounded-md text-white bg-blue-600 hover:bg-blue-900 text-lg font-semibold shadow-md transition duration-300 flex justify-center items-center"
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
                className="w-full flex items-center border-2 justify-center py-2.5 rounded-lg bg-white  border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-blue-200"
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
                className="w-full flex items-center border-2 justify-center py-2.5 mt-3 rounded-lg bg-white  border-gray-300 text-gray-800 font-semibold shadow-sm transition-all duration-300 hover:bg-blue-200"
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
      scriptProps={{
        async: false,
        defer: false,
        appendTo: "head",
        nonce: undefined,
      }}
    >
      <LoginForm />
    </GoogleReCaptchaProvider>
  );
}
