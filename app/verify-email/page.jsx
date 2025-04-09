"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [isResent, setIsResent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleResend = async () => {
    setIsLoading(true);
    // Add your actual resend logic here
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    setIsResent(true);
    setTimeout(() => setIsResent(false), 5000);
  };

  // SVG Icons
  const MailIcon = () => (
    <svg
      className="w-6 h-6 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );

  const CheckIcon = () => (
    <svg
      className="w-5 h-5 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );

  const WarningIcon = () => (
    <svg
      className="w-5 h-5 text-yellow-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg transition-all hover:shadow-xl">
      <div className="text-center mb-6">
        <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <MailIcon />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Almost There!</h1>
        <p className="text-gray-600">
          Just one more step to access your account
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 flex items-start">
        <CheckIcon className="mt-1 mr-3 flex-shrink-0" />
        <div>
          <p className="font-medium text-gray-800">
            Verification email sent to{" "}
            <span className="text-blue-600">{email}</span>
          </p>
          <p className="text-gray-600 mt-1">
            Click the link in the email to complete your registration.
          </p>
        </div>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start mb-3">
          <WarningIcon className="mt-1 mr-3 flex-shrink-0" />
          <h2 className="font-semibold text-gray-800">No email yet?</h2>
        </div>

        <ul className="space-y-2 pl-2">
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            <span>Check your spam or junk folder</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            <span>Wait 5-10 minutes for delivery</span>
          </li>
          <li className="flex items-center">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            <button
              onClick={handleResend}
              disabled={isLoading || isResent}
              className={`text-left ${
                isLoading ? "text-gray-500" : "text-blue-600 hover:underline"
              } ${isResent && "text-green-600"}`}
            >
              {isLoading
                ? "Sending..."
                : isResent
                ? "Email resent successfully!"
                : "Resend verification email"}
            </button>
          </li>
        </ul>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Having trouble?{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
