"use client";

import { useState, useEffect } from "react";
import Modal from "react-modal";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "../Sidebar/page";
import Image from "next/image";
import { logout } from "@/app/logout/actions";
import { useTheme } from "./ThemeContext";

if (typeof window !== "undefined") {
  Modal.setAppElement("body");
}

const SettingsPage = () => {
  useEffect(() => {
    const initializeModal = () => {
      try {
        if (typeof document !== "undefined") {
          const appElement = document.getElementById("__next");
          if (appElement) {
            Modal.setAppElement("#__next");
          } else {
            console.warn("#__next element not found, retrying...");
            setTimeout(initializeModal, 100);
          }
        }
      } catch (error) {
        console.error("Error initializing modal:", error);
      }
    };

    initializeModal();
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preferences");
  const [userProfile, setUserProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { theme, toggleTheme } = useTheme();
  const [tempNewPassword, setTempNewPassword] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({
    notifications: true,
    darkMode: theme === "dark",
  });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate password fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All password fields are required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation password do not match.");
      return;
    }

    try {
      setIsSaving(true);

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("User not authenticated. Please login again.");
        setIsSaving(false);
        return;
      }

      // Re-authenticate the user with current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (authError) {
        setError("Current password is incorrect.");
        setIsSaving(false);
        return;
      }

      // Store the new password temporarily
      setTempNewPassword(newPassword);

      // Show the logout prompt before actually updating the password
      setShowLogoutPrompt(true);
      setSuccess("Please confirm your action below");
    } catch (err) {
      console.error("Error updating password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Now actually update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: tempNewPassword,
      });

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return;
      }

      // Update password in users table
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("users")
        .update({
          password_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      // Log out after password change
      await logout();
      router.push("/login");
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  const handleContinue = async () => {
    try {
      // Update the password when user chooses to continue
      const { error: updateError } = await supabase.auth.updateUser({
        password: tempNewPassword,
      });

      if (updateError) {
        console.error("Failed to update password:", updateError);
        return;
      }

      // Update password in users table
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await supabase
        .from("users")
        .update({
          password_updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      setShowLogoutPrompt(false);
      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTempNewPassword("");
      setShowPasswordChange(false);
    } catch (err) {
      console.error("Error updating password:", err);
    }
  };

  // Apply theme to the body background
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.classList.add("bg-gray-900");
      document.body.classList.remove("bg-gray-50");
    } else {
      document.documentElement.classList.remove("dark");
      document.body.classList.add("bg-gray-50");
      document.body.classList.remove("bg-gray-900");
    }
  }, [theme]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Initialize dark mode from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  // Apply dark mode based on the toggle state
  useEffect(() => {
    if (formData.darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [formData.darkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const verifyAndFetch = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: userData, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (roleError || userData?.role !== "pet_owner") {
          router.push(
            userData?.role === "veterinary" ? "/vetclinic" : "/login"
          );
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("pet_owner_profiles")
          .select("first_name, last_name, profile_picture_url")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setUserProfile({
          id: user.id,
          email: user.email,
          first_name: profileData?.first_name || "",
          last_name: profileData?.last_name || "",
          profile_picture_url:
            profileData?.profile_picture_url || "/default-avatar.jpg",
        });

        setRoleVerified(true);
      } catch (err) {
        console.error("Error:", err.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetch();
  }, [router, supabase]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading || !roleVerified) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden ml-63">
        {/* Fixed Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              Settings
            </h1>

            {/* User Dropdown (with dark mode classes) */}
            {userProfile && (
              <div className="relative flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="focus:outline-none"
                  >
                    <Image
                      src={userProfile.profile_picture_url}
                      alt="User profile"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full cursor-pointer"
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 bg-white dark:bg-gray-700 divide-y divide-gray-100 dark:divide-gray-600 rounded-lg shadow-sm w-44">
                      <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        <div>{`${userProfile.first_name} ${userProfile.last_name}`}</div>
                        <div className="font-medium truncate">
                          {userProfile.email}
                        </div>
                      </div>

                      <ul className="py-2 text-sm text-gray-700 dark:text-gray-200">
                        <li>
                          <button
                            onClick={() => {
                              setActiveTab("profile");
                              setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Profile
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setActiveTab("settings");
                              setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Settings
                          </button>
                        </li>
                      </ul>

                      <div className="py-1">
                        <form action={logout}>
                          <button
                            type="submit"
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                          >
                            Logout
                          </button>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Settings Navigation */}
              <div className="w-full md:w-64 flex-shrink-0">
                <nav className="space-y-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "preferences"
                        ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Preferences
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "notifications"
                        ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      activeTab === "security"
                        ? "bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    Security
                  </button>
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                {activeTab === "preferences" && (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                      Preferences
                    </h2>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Dark Mode
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Toggle between light and dark theme
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={theme === "dark"}
                            onChange={toggleTheme}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {/* Rest of your form fields with dark mode classes */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Language
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Interface language
                          </p>
                        </div>
                        <select className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>English</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            Time Zone
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Your local time zone
                          </p>
                        </div>
                        <select className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>
                            (GMT-12:00) International Date Line West
                          </option>
                          <option>
                            (GMT-08:00) Pacific Time (US & Canada)
                          </option>
                          <option>
                            (GMT-05:00) Eastern Time (US & Canada)
                          </option>
                          <option>(GMT+00:00) Greenwich Mean Time</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 mr-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "notifications" && (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">
                      Notification Preferences
                    </h2>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">
                            Email Notifications
                          </h3>
                          <p className="text-sm text-gray-500">
                            Receive email notifications
                          </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications"
                            checked={formData.notifications}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-4">
                          Notification Types
                        </h3>

                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="appointment-reminders"
                                name="appointment-reminders"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="appointment-reminders"
                                className="font-medium text-gray-700"
                              >
                                Appointment Reminders
                              </label>
                              <p className="text-gray-500">
                                Get reminders for upcoming appointments
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="health-alerts"
                                name="health-alerts"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="health-alerts"
                                className="font-medium text-gray-700"
                              >
                                Health Alerts
                              </label>
                              <p className="text-gray-500">
                                Important health notifications about your pets
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="promotional"
                                name="promotional"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label
                                htmlFor="promotional"
                                className="font-medium text-gray-700"
                              >
                                Promotional Offers
                              </label>
                              <p className="text-gray-500">
                                Special offers and discounts from our partners
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? "Saving..." : "Save Preferences"}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
                      Security Settings
                    </h2>

                    <div className="space-y-6">
                      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                          Change Password
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Update your account password
                        </p>

                        {!showPasswordChange ? (
                          <button
                            onClick={() => setShowPasswordChange(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Change Password
                          </button>
                        ) : (
                          <form
                            onSubmit={handlePasswordChange}
                            className="space-y-4"
                          >
                            {error && (
                              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded-md">
                                {error}
                              </div>
                            )}
                            {success && (
                              <div className="p-3 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-100 rounded-md">
                                {success}
                              </div>
                            )}

                            <div>
                              <label
                                htmlFor="currentPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              >
                                Current Password
                              </label>
                              <input
                                type="password"
                                id="currentPassword"
                                value={currentPassword}
                                onChange={(e) =>
                                  setCurrentPassword(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="newPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              >
                                New Password
                              </label>
                              <input
                                type="password"
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                minLength={6}
                              />
                            </div>

                            <div>
                              <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                              >
                                Confirm New Password
                              </label>
                              <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) =>
                                  setConfirmPassword(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                                minLength={6}
                              />
                            </div>
                            <Modal
                              isOpen={showLogoutPrompt}
                              onRequestClose={() => setShowLogoutPrompt(false)}
                              className="modal"
                              overlayClassName="modal-overlay"
                              appElement={
                                typeof document !== "undefined"
                                  ? document.getElementById("__next")
                                  : undefined
                              }
                            >
                              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                  Password Change Confirmation
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                  For security reasons, we recommend logging out
                                  of all sessions after changing your password.
                                  Would you like to log out now?
                                </p>
                                <div className="flex justify-end space-x-3">
                                  <button
                                    onClick={handleContinue}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                                  >
                                    Stay Logged In
                                  </button>
                                  <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    Log Out
                                  </button>
                                </div>
                              </div>
                            </Modal>
                            <Modal
                              isOpen={showErrorModal}
                              onRequestClose={() => setShowErrorModal(false)}
                              className="modal"
                              overlayClassName="modal-overlay"
                              appElement={
                                typeof document !== "undefined"
                                  ? document.getElementById("__next")
                                  : undefined
                              }
                            >
                              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                  Error
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                  {errorMessage}
                                </p>
                                <div className="flex justify-end">
                                  <button
                                    onClick={() => setShowErrorModal(false)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                  >
                                    OK
                                  </button>
                                </div>
                              </div>
                            </Modal>
                            <div className="flex justify-end space-x-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowPasswordChange(false);
                                  setError("");
                                  setSuccess("");
                                  setCurrentPassword("");
                                  setNewPassword("");
                                  setConfirmPassword("");
                                }}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={isSaving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isSaving ? "Updating..." : "Update Password"}
                              </button>
                            </div>
                          </form>
                        )}
                      </div>

                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                          Two-Factor Authentication
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Add an extra layer of security to your account
                        </p>
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Disabled
                          </span>
                          <button
                            onClick={() => router.push("/enable-2fa")}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Enable
                          </button>
                        </div>
                      </div>

                      <div className="pb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">
                          Active Sessions
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">
                          Manage your logged-in devices
                        </p>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                Chrome on Windows
                              </p>
                              <p className="text-xs text-gray-500">
                                Last active: 2 hours ago
                              </p>
                            </div>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Log out
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
