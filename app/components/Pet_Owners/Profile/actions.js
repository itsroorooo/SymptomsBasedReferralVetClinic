"use client";

import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export const useProfileActions = () => {
  const supabase = createClient();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [tempImageUrl, setTempImageUrl] = useState(null); // For preview before saving
  const [subscription, setSubscription] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(""); // To store original image for cancellation

  // Set up realtime subscription when component mounts
  useEffect(() => {
    const setupRealtime = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to changes in the user's profile
      const newSubscription = supabase
        .channel("profile_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "pet_owner_profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            if (
              payload.eventType === "UPDATE" ||
              payload.eventType === "INSERT"
            ) {
              const newProfile = {
                ...userProfile,
                firstName: payload.new.first_name || "",
                lastName: payload.new.last_name || "",
                contactNumber: payload.new.contact_number || "",
                photo:
                  payload.new.profile_picture_url ||
                  "/image/default-avatar.png",
              };
              setUserProfile(newProfile);
              if (payload.new.profile_picture_url) {
                setImageUrl(payload.new.profile_picture_url);
                setOriginalImageUrl(payload.new.profile_picture_url);
              }
            }
          }
        )
        .subscribe();

      setSubscription(newSubscription);

      return () => {
        if (newSubscription) {
          supabase.removeChannel(newSubscription);
        }
      };
    };

    setupRealtime();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const fetchProfile = async (setProfile, setIsLoading) => {
    try {
      setIsLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/login");
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("pet_owner_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const profile = {
        firstName: profileData?.first_name || "",
        lastName: profileData?.last_name || "",
        email: user.email || "",
        contactNumber: profileData?.contact_number || "",
        photo: profileData?.profile_picture_url || "/image/default-avatar.png",
      };

      setUserProfile(profile);
      setImageUrl(profile.photo);
      setOriginalImageUrl(profile.photo); // Store original image URL

      return profile;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      alert("Only JPG, PNG, or WEBP images are allowed");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setTempImageUrl(previewUrl);
  };

  const handlePhotoUpload = async (file) => {
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

      return publicUrl;
    } catch (error) {
      console.error("Photo upload error:", error);
      alert(error.message || "Failed to upload photo");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Revert to original image
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
    setImageUrl(originalImageUrl);
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

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user?.id) throw new Error("User not authenticated");

      // First handle photo upload if there's a temp image
      if (tempImageUrl) {
        await handlePhotoUpload();
      }

      // Prepare update data
      const updateData = {
        first_name: formData.get("firstName") || profile.firstName,
        last_name: formData.get("lastName") || profile.lastName,
        contact_number: formData.get("contactNumber") || profile.contactNumber,
        updated_at: new Date().toISOString(),
      };

      // Update profile in database
      const { error: updateError } = await supabase
        .from("pet_owner_profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) throw updateError;

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
    userProfile,
    imageUrl: tempImageUrl || imageUrl, // Show temp image if exists
    isLoading,
    fetchProfile,
    handlePhotoSelect,
    handlePhotoUpload,
    handleSubmit,
    handleCancel,
  };
};
