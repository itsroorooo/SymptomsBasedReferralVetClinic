"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

export default function UserAdmin({
  users = [],
  allUsers = [],
  handleAction,
  searchTerm,
  setSearchTerm,
  isUserActive,
}) {
  const [fetchedUsers, setFetchedUsers] = useState([]); // Renamed state variable
  const [loading, setLoading] = useState(true);

  // Fetch users from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Fetch users and pet owner profiles
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, role, created_at");

        if (usersError) throw usersError;

        const { data: profilesData, error: profilesError } = await supabase
          .from("pet_owner_profiles")
          .select("id, profile_picture_url");

        if (profilesError) throw profilesError;

        // Merge user data with profile data
        const mergedData = usersData.map((user) => {
          const profile = profilesData.find((p) => p.id === user.id);
          return {
            ...user,
            profile_picture_url: profile?.profile_picture_url || null,
          };
        });

        setFetchedUsers(mergedData); // Update renamed state variable
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Process users with consistent active status calculation
  const processedUsers = fetchedUsers.map((user) => {
    const lastSeenDate = user.lastSeen
      ? new Date(user.lastSeen)
      : new Date(user.signupDate || new Date());
    const today = new Date();
    const diffTime = Math.abs(today - lastSeenDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Use the passed isUserActive function if available, otherwise calculate locally
    const status = isUserActive
      ? isUserActive(user)
        ? "active"
        : "inactive"
      : diffDays < 730
      ? "active"
      : "inactive";

    return {
      ...user,
      status,
      daysSinceLastSeen: diffDays,
      lastSeenDate,
    };
  });

  // Filter users based on search term
  const filteredUsers = processedUsers.filter(
    (user) =>
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate active users count using the same logic as dashboard
  const activeUsersCount = isUserActive
    ? allUsers.filter(isUserActive).length
    : processedUsers.filter((u) => u.status === "active").length;

  return (
    <div style={{ marginLeft: "5px" }} className="space-y-6">
      {/* Stats Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          User Statistics
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Total Users</h3>
            <p className="text-2xl font-bold">{allUsers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Active</h3>
            <p className="text-2xl font-bold">{activeUsersCount}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Inactive</h3>
            <p className="text-2xl font-bold">
              {allUsers.length - activeUsersCount}
            </p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          User Management
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">First Name</th>
                <th className="py-3 px-4 text-left">Last Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Role</th>
                <th className="py-3 px-4 text-left">Created At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{user.first_name || "N/A"}</td>
                    <td className="py-3 px-4">{user.last_name || "N/A"}</td>
                    <td className="py-3 px-4">{user.email || "N/A"}</td>
                    <td className="py-3 px-4">{user.role || "N/A"}</td>
                    <td className="py-3 px-4">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleAction(user.id, "edit")}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleAction(user.id, "delete")}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}