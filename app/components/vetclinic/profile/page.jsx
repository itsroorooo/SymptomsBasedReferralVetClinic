"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { LoadScript } from "@react-google-maps/api";


const ClinicProfile = ({ clinicId }) => {
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    clinic_name: "",
    description: "",
    address: "",
    city: "",
    province: "",
    zip_code: "",
    country: "",
    contact_number: "",
    email: "",
    website: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [previewLogo, setPreviewLogo] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Geocode address using Google Maps API
  const geocodeAddress = async (address) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      
      if (data.status === "OK" && data.results.length > 0) {
        return {
          latitude: data.results[0].geometry.location.lat,
          longitude: data.results[0].geometry.location.lng
        };
      }
      throw new Error(data.error_message || "Address not found");
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        const { data, error } = await supabase
          .from("veterinary_clinics")
          .select("*")
          .eq("id", clinicId)
          .single();

        if (error) throw error;

        setClinic(data);
        setFormData({
          clinic_name: data.clinic_name || "",
          description: data.description || "",
          address: data.address || "",
          city: data.city || "",
          province: data.province || "",
          zip_code: data.zip_code || "",
          country: data.country || "",
          contact_number: data.contact_number || "",
          email: data.email || "",
          website: data.website || "",
        });
        if (data.logo_url) setPreviewLogo(data.logo_url);
      } catch (error) {
        console.error("Error fetching clinic:", error);
        setErrors({ general: "Failed to load clinic data" });
      } finally {
        setLoading(false);
      }
    };

    if (clinicId) fetchClinic();
  }, [clinicId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    try {
      let logoUrl = clinic?.logo_url;
      let coordinates = {
        latitude: clinic?.latitude,
        longitude: clinic?.longitude
      };

      // Only geocode if address fields changed
      const addressChanged = 
        formData.address !== clinic.address ||
        formData.city !== clinic.city ||
        formData.province !== clinic.province ||
        formData.country !== clinic.country;

      if (addressChanged) {
        const fullAddress = `${formData.address}, ${formData.city}, ${formData.province}, ${formData.country}`;
        coordinates = await geocodeAddress(fullAddress);
      }

      // Upload new logo if selected
      if (logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const fileName = `${clinicId}-${Date.now()}.${fileExt}`;
        const filePath = `clinic-logos/${fileName}`;

        // Remove old logo if exists
        if (clinic?.logo_url) {
          const oldFileName = clinic.logo_url.split('/').pop();
          await supabase.storage
            .from("clinic-logos")
            .remove([oldFileName]);
        }

        const { error: uploadError } = await supabase.storage
          .from("clinic-logos")
          .upload(filePath, logoFile);

        if (uploadError) throw uploadError;

        logoUrl = supabase.storage.from("clinic-logos").getPublicUrl(filePath).data.publicUrl;
      }

      // Update clinic data including coordinates
      const { data, error } = await supabase
        .from("veterinary_clinics")
        .update({
          ...formData,
          logo_url: logoUrl,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          updated_at: new Date().toISOString(),
        })
        .eq("id", clinicId)
        .select();

      if (error) throw error;

      setClinic(data[0]);
      setEditMode(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating clinic:", error);
      setErrors({
        general: error.message || "Failed to update clinic profile",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !clinic) {
    return <div className="flex justify-center items-center h-screen">Loading clinic profile...</div>;
  }

  if (!clinic) {
    return <div className="flex justify-center items-center h-screen">Clinic not found</div>;
  }

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      onLoad={() => setGoogleMapsLoaded(true)}
      onError={(error) => console.error("Google Maps script failed to load", error)}
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {successMessage && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
            {successMessage}
          </div>
        )}
        {errors.general && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {/* Header with Clinic Logo and Name */}
          <div className="bg-white p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-24 h-24 rounded-full bg-gray-50 overflow-hidden border-2 border-gray-200">
                {previewLogo ? (
                  <Image
                    src={previewLogo}
                    alt={`${clinic.clinic_name} logo`}
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <span className="text-gray-400 text-2xl font-bold">
                      {clinic.clinic_name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">{clinic.clinic_name}</h1>
                <p className="text-gray-500 mb-4">{clinic.city}, {clinic.province}</p>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition shadow-sm text-sm font-medium"
                >
                  {editMode ? "Cancel Editing" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name</label>
                      <input
                        type="text"
                        name="clinic_name"
                        value={formData.clinic_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        rows="4"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                      <div className="flex items-center gap-4">
                        {previewLogo && (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border border-gray-200">
                            <Image
                              src={previewLogo}
                              alt="Logo preview"
                              layout="fill"
                              objectFit="cover"
                            />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-gray-100 file:text-gray-700
                            hover:file:bg-gray-200"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
                        <input
                          type="text"
                          name="province"
                          value={formData.province}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                        <input
                          type="text"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                        <input
                          type="tel"
                          name="contact_number"
                          value={formData.contact_number}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || !googleMapsLoaded}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50 transition"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                {!googleMapsLoaded && (
                  <p className="text-sm text-yellow-600">Google Maps is loading, geocoding will be available soon...</p>
                )}
              </form>
            ) : (
              <div className="space-y-8">
                {/* About Section */}
                <div className="rounded-lg p-5 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">About Us</h2>
                  <p className="text-gray-600">
                    {clinic.description || "No description provided."}
                  </p>
                </div>
                    
              {/* Contact Section */}
              <div className="rounded-lg p-5 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800 mb-3">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p className="text-sm text-gray-700">
                        {clinic.address},{clinic.zip_code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-1">
                      <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-sm text-gray-700">{clinic.contact_number}</p>
                    </div>
                  </div>
                  
                  {clinic.email && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-sm text-gray-700">{clinic.email}</p>
                      </div>
                    </div>
                  )}
                  
                  {clinic.website && (
                    <div className="flex items-start">
                      <div className="flex-shrink-0 pt-1">
                        <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-500">Website</p>
                        <a 
                          href={clinic.website.startsWith('http') ? clinic.website : `https://${clinic.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {clinic.website}
                        </a>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

export default ClinicProfile;