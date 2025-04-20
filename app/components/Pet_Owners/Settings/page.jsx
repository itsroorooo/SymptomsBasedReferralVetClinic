"use client";

import { useState } from "react";
import Preferences from "./preferences";
import Notifications from "./notifications";
import Security from "./security";
import { useTheme } from "next-themes";

export default function ProfileSettings() {
  const [activeTab, setActiveTab] = useState("preferences");
  const { theme, setTheme } = useTheme();

  // Render the appropriate component based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case "notifications":
        return <Notifications />;
      case "security":
        return <Security />;
      default:
        return <Preferences />;
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {/* Settings content */}
      <main className="m-25 flex-1 flex flex-col">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Navigations */}
            <div className="w-full md:w-64 flex-shrink-0">
              <nav className="space-y-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <button
                  onClick={() => setActiveTab("preferences")}
                  className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-400 hover:text-white dark:hover:bg-gray-700 ${
                    activeTab === "preferences"
                      ? "bg-gray-900 dark:bg-gray-700 text-white dark:text-blue-400 font-medium"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-400 hover:text-white dark:hover:bg-gray-700 ${
                    activeTab === "notifications"
                      ? "bg-gray-900 dark:bg-gray-700 text-white dark:text-blue-400 font-medium"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab("security")}
                  className={`w-full text-left px-4 py-3 rounded-lg hover:bg-blue-400 hover:text-white dark:hover:bg-gray-700 ${
                    activeTab === "security"
                      ? "bg-gray-900 dark:bg-gray-700 text-white dark:text-blue-400 font-medium"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  Security
                </button>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 max-w-6xl bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              {renderContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
