"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

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
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Get the current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/login");
          return;
        }

        // Fetch pet owner profile data
        const { data: profileData, error: profileError } = await supabase
          .from("pet_owner_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile({
          firstName: profileData?.first_name || "",
          lastName: profileData?.last_name || "",
          email: user.email || "",
          contactNumber: profileData?.contact_number || "",
          photo:
            profileData?.profile_picture_url || "/image/default-avatar.png",
        });
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router, supabase]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prevProfile) => ({
      ...prevProfile,
      [name]: value,
    }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert("Image size should be under 1MB.");
      return;
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = async () => {
      if (img.width !== img.height) {
        alert("Image must have a 1:1 aspect ratio.");
        return;
      }

      const formData = new FormData();
      formData.append("photo", file);

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Upload to Supabase Storage
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `profile_photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("profile-photos").getPublicUrl(filePath);

        // Update profile in database
        const { error: updateError } = await supabase
          .from("pet_owner_profiles")
          .update({ profile_picture_url: publicUrl })
          .eq("id", user.id);

        if (updateError) throw updateError;

        // Update local state
        setProfile((prev) => ({
          ...prev,
          photo: publicUrl,
        }));

        // Notify parent component
        if (onPhotoChange) onPhotoChange(publicUrl);
      } catch (error) {
        console.error("Photo upload failed:", error);
        alert("Photo upload failed. Please try again.");
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      alert("Please enter a valid email address");
      return;
    }

    // Optional contact number validation
    if (profile.contactNumber && !/^[\d\s+-]+$/.test(profile.contactNumber)) {
      alert("Please enter a valid contact number");
      return;
    }

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Update profile in database
      const { error } = await supabase
        .from("pet_owner_profiles")
        .update({
          first_name: profile.firstName,
          last_name: profile.lastName,
          contact_number: profile.contactNumber,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile. Please try again.");
    }
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
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
          />
          <label
            htmlFor="photo-upload"
            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600"
          >
            Upload Photo
          </label>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Image size should be under 1MB and image ratio needs to be 1:1.
          </p>
        </div>

        <div className="w-2/3">
          <form onSubmit={handleSubmit}>
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
                disabled={true} // Email is not editable in this version
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
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save Changes
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
