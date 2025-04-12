// app/veterinary-clinic/notifications/page.js
"use client";

import { useNotification } from "../context/NotificationContext";

export default function NotificationsPage() {
  const { isNotificationOpen } = useNotification();

  // Dummy notification data
  const notifications = [
    { id: 1, message: "New appointment scheduled for Max (Golden Retriever)", time: "2 hours ago" },
    { id: 2, message: "Lab results for Bella (Poodle) are ready", time: "5 hours ago" },
    { id: 3, message: "Equipment maintenance reminder", time: "1 day ago" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      {/* Notification dropdown (if opened from the header) */}
      {isNotificationOpen && (
        <div className="mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <p className="font-medium">{notification.message}</p>
                <p className="text-xs text-gray-500">{notification.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}