"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

const supabase = createClient();

const DeleteConfirmationModal = ({ userId, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full animate-pop-in">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-pink-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">Wait a second!</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this user? This action can't be undone. 
            All their pet data will be lost forever. 🐾
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Yes, Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function UserAdmin({
  users = [],
  allUsers = [],
  handleAction,
  searchTerm,
  setSearchTerm,
  isUserActive,
}) {
  const [fetchedUsers, setFetchedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, email, first_name, last_name, role, updated_at, created_at")
          .eq("role", "pet_owner");

        if (usersError) throw usersError;

        const { data: profilesData, error: profilesError } = await supabase
          .from("pet_owner_profiles")
          .select("id, profile_picture_url");

        if (profilesError) throw profilesError;

        const mergedData = usersData.map((user) => {
          const profile = profilesData.find((p) => p.id === user.id);
          return {
            ...user,
            profile_picture_url: profile?.profile_picture_url || null,
          };
        });

        setFetchedUsers(mergedData);
      } catch (error) {
        console.error("Error fetching users:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteClick = (userId) => {
    setUserToDelete(userId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userToDelete);
      if (error) throw error;
      setFetchedUsers((prevUsers) => prevUsers.filter((user) => user.id !== userToDelete));
    } catch (error) {
      console.error("Error deleting user:", error.message);
    } finally {
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const processedUsers = fetchedUsers.map((user) => {
    const lastSeenDate = user.lastSeen
      ? new Date(user.lastSeen)
      : new Date(user.signupDate || new Date());
    const today = new Date();
    const diffTime = Math.abs(today - lastSeenDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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

  const filteredUsers = processedUsers
    .filter((user) => user.role !== "veterinary")
    .filter(
      (user) =>
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            <p className="text-2xl font-bold">
              {allUsers.filter(isUserActive).length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Inactive</h3>
            <p className="text-2xl font-bold">
              {allUsers.length - allUsers.filter(isUserActive).length}
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
            placeholder="Search by name or email..."
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
                <th className="py-3 px-4 text-left">Full Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Created At</th>
                <th className="py-3 px-4 text-left">Updated At</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {`${user.first_name || "N/A"} ${
                        user.last_name || "N/A"
                      }`}
                    </td>
                    <td className="py-3 px-4">{user.email || "N/A"}</td>
                    <td className="py-3 px-4">
                      {user.created_at
                        ? new Date(user.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4">
                      {user.updated_at
                        ? new Date(user.updated_at).toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleDeleteClick(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          userId={userToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}