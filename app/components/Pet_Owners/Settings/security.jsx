"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "react-modal";

export default function Security() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showLogoutPrompt, setShowLogoutPrompt] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 1,
      device: "Chrome on Windows",
      location: "New York, NY",
      lastActive: "2 hours ago",
      current: true,
    },
    {
      id: 2,
      device: "Safari on iPhone",
      location: "San Francisco, CA",
      lastActive: "1 day ago",
      current: false,
    },
  ]);
  const [showSessions, setShowSessions] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setIsSaving(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccess("Password changed successfully!");
      setShowLogoutPrompt(true);
    } catch (err) {
      setErrorMessage("Failed to change password. Please try again.");
      setShowErrorModal(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    // Implement logout logic
    router.push("/login");
  };

  const handleContinue = () => {
    setShowLogoutPrompt(false);
    setShowPasswordChange(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const toggleTwoFactor = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const revokeSession = (id) => {
    setActiveSessions(activeSessions.filter((session) => session.id !== id));
  };

  return (
    <form className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-8">
        Security Settings
      </h2>

      <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {/* Password Change Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                Password
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Change your account password
              </p>
            </div>
            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Change Password
              </button>
            ) : (
              <button
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
            )}
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="mt-6 space-y-4">
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
                  onChange={(e) => setCurrentPassword(e.target.value)}
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
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Updating...
                    </span>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Two-Factor Authentication Section */}
        <div className="pt-6 border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {twoFactorEnabled
                  ? "Enabled - Adds extra security to your account"
                  : "Disabled - Add an extra layer of security"}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={twoFactorEnabled}
                onChange={toggleTwoFactor}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          {twoFactorEnabled && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                Recovery Codes
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Save these codes in a secure place in case you lose access to
                your authentication device.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["A1B2-C3D4", "E5F6-G7H8", "I9J0-K1L2", "M3N4-O5P6"].map(
                  (code) => (
                    <div
                      key={code}
                      className="bg-white dark:bg-gray-800 p-2 rounded text-center font-mono text-sm"
                    >
                      {code}
                    </div>
                  )
                )}
              </div>
              <button className="mt-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                Generate New Codes
              </button>
            </div>
          )}
        </div>

        {/* Active Sessions Section */}
        <div className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                Active Sessions
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View and manage your active login sessions
              </p>
            </div>
            <button
              onClick={() => setShowSessions(!showSessions)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showSessions ? "Hide Sessions" : "View Sessions"}
            </button>
          </div>

          {showSessions && (
            <div className="mt-4 space-y-4">
              {activeSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-medium text-gray-800 dark:text-gray-200">
                        {session.device}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {session.location} • {session.lastActive}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {session.current && (
                        <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
                          Current
                        </span>
                      )}
                      {!session.current && (
                        <button
                          onClick={() => revokeSession(session.id)}
                          className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modals */}
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
              For security reasons, we recommend logging out of all sessions
              after changing your password. Would you like to log out now?
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
      </div>
    </form>
  );
}
