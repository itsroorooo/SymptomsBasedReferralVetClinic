"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Notifications() {
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    emailNotifications: false,
    pushNotifications: true,
    appointmentReminders: true,
    healthAlerts: true,
    promotionalOffers: false,
    newsletter: false,
    smsNotifications: false,
    emergencyAlerts: true,
  });

  const handleInputChange = (e) => {
    const { name, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("Notification preferences saved:", formData);
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-8">
        Notification Preferences
      </h2>

      <div className="space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Notifications Section */}
          <div className="col-span-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Push Notifications Section */}
          <div className="col-span-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Receive app notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="pushNotifications"
                  checked={formData.pushNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* SMS Notifications Section */}
          <div className="col-span-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  SMS Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Receive text messages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="smsNotifications"
                  checked={formData.smsNotifications}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Emergency Alerts Section */}
          <div className="col-span-1">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Emergency Alerts
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Critical health alerts
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="emergencyAlerts"
                  checked={formData.emergencyAlerts}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Notification Types Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="mb-3">
                <h3 className="text-base font-medium text-gray-800 dark:text-gray-200">
                  Notification Types
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Customize which notifications you receive
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="appointment-reminders"
                      name="appointmentReminders"
                      type="checkbox"
                      checked={formData.appointmentReminders}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="appointment-reminders"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      Appointment Reminders
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Get reminders for upcoming appointments
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="health-alerts"
                      name="healthAlerts"
                      type="checkbox"
                      checked={formData.healthAlerts}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="health-alerts"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      Health Alerts
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Important health notifications about your pets
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="promotional-offers"
                      name="promotionalOffers"
                      type="checkbox"
                      checked={formData.promotionalOffers}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="promotional-offers"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      Promotional Offers
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Special offers and discounts from our partners
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="newsletter"
                      name="newsletter"
                      type="checkbox"
                      checked={formData.newsletter}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="newsletter"
                      className="font-medium text-gray-700 dark:text-gray-300"
                    >
                      Monthly Newsletter
                    </label>
                    <p className="text-gray-500 dark:text-gray-400">
                      Pet care tips and clinic updates
                    </p>
                  </div>
                </div>
              </div>
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
