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
  const [imageUrl, setImageUrl] = useState("");

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
    await handlePhotoUpload(file, setImageUrl, setProfile, setIsLoading);
  };

  const onSubmit = async (e) => {
    await handleSubmit(e, profile, setProfile, setIsLoading, setIsEditing);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="ml-[50px] font-[Poppins] pt-8 pl-8 pr-8 pb-0 bg-gray-100 flex flex-col min-h-[80.5vh]">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow-md flex gap-8">
        <div className="w-1/3 flex flex-col items-center border-r pr-6">
          <img
            src={profile.photo}
            alt="Profile"
            className="w-64 h-64 rounded-full object-cover mb-4"
          />
          <input
            type="file"
            accept="image/jpeg,image/png"
            onChange={onPhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          {imageUrl && <img src={imageUrl} alt="Profile" width={100} />}
          <label
            htmlFor="photo-upload"
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
          >
            Upload Photo
          </label>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Image size should be under 2MB
          </p>
        </div>

        <div className="w-2/3">
          <form onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded"
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={true}
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                name="contactNumber"
                value={profile.contactNumber}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={!isEditing}
                placeholder="+63 123 456 7890"
              />
            </div>

            <div className="flex justify-end">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
