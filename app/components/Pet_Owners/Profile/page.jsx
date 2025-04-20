"use client";

import React, { useState, useEffect } from "react";
import { useProfileActions } from "./actions";

const ProfilePage = ({ onPhotoChange }) => {
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    photo: "/image/default-avatar.png",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tempPhotoFile, setTempPhotoFile] = useState(null);
  const [tempProfile, setTempProfile] = useState(null);

  const { fetchProfile, handlePhotoUpload, handleSubmit } = useProfileActions();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await fetchProfile(setProfile, setIsLoading);
        if (profileData) {
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const onPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Create a temporary URL for preview
    const previewUrl = URL.createObjectURL(file);
    setTempPhotoFile({
      file,
      previewUrl,
    });
  };

  const onSubmit = async (e) => {
    try {
      setIsLoading(true);

      let photoUrl = profile.photo;

      // If there's a new photo file, upload it first
      if (tempPhotoFile) {
        photoUrl = await handlePhotoUpload(tempPhotoFile.file);
        if (photoUrl) {
          setProfile((prev) => ({ ...prev, photo: photoUrl }));
          if (onPhotoChange) {
            // Check if callback exists before calling
            onPhotoChange(photoUrl); // Notify parent of photo change
          }
        }
      }

      await handleSubmit(e, profile, setProfile, setIsLoading, setIsEditing);
      setTempPhotoFile(null);
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = () => {
    setIsEditing(false);
    setTempPhotoFile(null); // Clear the temporary photo file
    if (tempProfile) {
      setProfile(tempProfile); // Restore original profile
      setTempProfile(null);
    }
  };

  const onEditStart = () => {
    setTempProfile({ ...profile }); // Save current profile state
    setIsEditing(true);
  };

  const displayPhoto = tempPhotoFile?.previewUrl || profile.photo;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] p-6 md:p-10 bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col min-h-[80.5vh]">
      <div className="max-w-6xl mx-auto w-full m-20">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-10">
          {/* Profile Picture Section */}
          <div className="md:w-1/3 flex flex-col items-center mt-8">
            <div className="relative mb-6">
              <img
                src={displayPhoto}
                alt="Profile"
                className="w-48 h-48 rounded-full object-cover border-4 border-white shadow-md"
              />
              {isEditing && (
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-3 right-3 bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"
                    />
                  </svg>
                </label>
              )}
            </div>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-xs text-gray-500 mt-4 text-center">
              JPG, PNG, or WEBP, max 2MB
            </p>
          </div>

          {/* Profile Form Section */}
          <div className="md:w-2/3">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isEditing
                        ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        : "border-transparent bg-gray-50"
                    } transition-all`}
                    disabled={!isEditing}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      isEditing
                        ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        : "border-transparent bg-gray-50"
                    } transition-all`}
                    disabled={!isEditing}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-transparent bg-gray-50"
                  disabled={true}
                  required
                />
                <p className="text-xs text-red-500 mt-2">
                  Email cannot be changed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={profile.contactNumber}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    isEditing
                      ? "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      : "border-transparent bg-gray-50"
                  } transition-all`}
                  disabled={!isEditing}
                  placeholder="+63 123 456 7890"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoading ? (
                        <>
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
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onEditStart}
                    className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
