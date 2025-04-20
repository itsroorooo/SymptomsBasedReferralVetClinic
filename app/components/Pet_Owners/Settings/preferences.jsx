"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

export default function Preferences() {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const darkMode = theme === "dark";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-8">
        Preferences
      </h2>

      <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Dark Mode Section */}
          <div className="col-span-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Toggle between light and dark theme
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={darkMode}
                  onChange={toggleTheme}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Language Section */}
          <div className="col-span-1">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="mb-3">
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Language
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Interface language
                </p>
              </div>
              <select className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>English</option>
              </select>
            </div>
          </div>

          {/* Time Zone Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="mb-3">
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Time Zone
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Your local time zone
                </p>
              </div>
              <select className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-md px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>(GMT-12:00) International Date Line West</option>
                <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                <option>(GMT+00:00) Greenwich Mean Time</option>
                <option>(GMT+01:00) Central European Time</option>
                <option>(GMT+08:00) Beijing Time</option>
                <option>(GMT+09:00) Japan Standard Time</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </span>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
