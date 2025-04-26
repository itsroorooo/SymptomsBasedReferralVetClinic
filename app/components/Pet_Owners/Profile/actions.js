"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const useProfileActions = () => {
  const supabase = createClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  const fetchProfile = async (setProfile, setIsLoading) => {
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

      return {
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        email: user.email || "",
        contactNumber: profileData?.contact_number || "",
        photo: profileData?.profile_picture_url || "/image/default-avatar.png",
      };
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (file, setProfile) => {
    try {
      setIsLoading(true);

      // Validate file type
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        throw new Error("Only JPG, PNG, or WEBP images are allowed");
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Image must be smaller than 2MB");
      }

      // Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id)
        throw authError || new Error("User not authenticated");

      // Generate unique filename
      const fileExt = file.name.split(".").pop().toLowerCase();
      const fileName = `profile-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-photos").getPublicUrl(filePath);

      // Update profile in database
      const { error: profileError } = await supabase
        .from("pet_owner_profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update local state
      setImageUrl(publicUrl);
      setUserProfile((prev) => ({
        ...prev,
        profile_picture_url: publicUrl,
      }));

      return publicUrl;
    } catch (error) {
      console.error("Photo upload error:", error);
      alert(error.message || "Failed to upload photo");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (
    e,
    profile,
    setProfile,
    setIsLoading,
    setIsEditing
  ) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);

    try {
      setIsLoading(true);

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id)
        throw authError || new Error("User not authenticated");

      // Prepare update data
      const updateData = {
        first_name: formData.get("firstName") || profile.firstName,
        last_name: formData.get("lastName") || profile.lastName,
        contact_number: formData.get("contactNumber") || profile.contactNumber,
        updated_at: new Date().toISOString(),
      };

      // Handle profile photo if changed
      const photoInput = form.querySelector('input[type="file"]');
      if (photoInput?.files.length > 0) {
        await handlePhotoUpload(
          photoInput.files[0],
          null,
          setProfile,
          setIsLoading
        );
      }

      // Update profile in database
      const { error: updateError } = await supabase
        .from("pet_owner_profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfile((prev) => ({ ...prev, ...updateData }));
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      alert(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fetchProfile,
    handlePhotoUpload,
    handleSubmit,
  };
};