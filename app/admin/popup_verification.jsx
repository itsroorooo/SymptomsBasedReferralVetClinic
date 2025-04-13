"use client";

import { useState } from "react";

const DeleteConfirmationModal = ({ userId, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full animate-pop-in">
        <div className="text-center">
          {/* Cute pet icon */}
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
              onClick={() => onConfirm(userId)}
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

// Then modify your handleDelete function to use this modal:
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [userToDelete, setUserToDelete] = useState(null);

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

// Update your delete button in the table to use handleDeleteClick instead:
<button
  onClick={() => handleDeleteClick(user.id)}
  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
>
  Delete
</button>

// Add the modal to your component's return statement:
{showDeleteModal && (
  <DeleteConfirmationModal
    userId={userToDelete}
    onConfirm={handleConfirmDelete}
    onCancel={() => setShowDeleteModal(false)}
  />
)}
