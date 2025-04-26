"use client";

import React, { useState, useRef, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";
import { createClient } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { LoadScript } from "@react-google-maps/api";
import { countries, countryProvinces, philippineCitiesByProvince } from "@/lib/locationData";

const supabase = createClient();

export default function VetClinicAdd() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    clinic_name: "",
    email: "",
    password: "",
    confirm_password: "",
    address: "",
    city: "",
    zip_code: "",
    country: "",
    province: "",
    contact_number: "",
    website: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  const [locationStatus, setLocationStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const [availableProvinces, setAvailableProvinces] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const autocompleteRef = useRef(null);

  // Update available provinces when country changes
  useEffect(() => {
    if (formData.country) {
      const provinces = countryProvinces[formData.country] || [];
      setAvailableProvinces(provinces);
      
      // Reset province and city when country changes
      setFormData(prev => ({
        ...prev,
        province: "",
        city: ""
      }));
      setAvailableCities([]);
    }
  }, [formData.country]);

  // Update available cities when province changes (Philippines only)
  useEffect(() => {
    if (formData.country === "Philippines" && formData.province) {
      const cities = philippineCitiesByProvince[formData.province] || [];
      setAvailableCities(cities);
      
      // Reset city when province changes
      setFormData(prev => ({
        ...prev,
        city: ""
      }));
    } else {
      setAvailableCities([]);
    }
  }, [formData.province, formData.country]);

  // Initialize Places Autocomplete when Google Maps loads
  useEffect(() => {
    if (googleMapsLoaded && window.google) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        autocompleteRef.current,
        {
          types: ["geocode"],
          fields: ["address_components", "formatted_address", "geometry"],
        }
      );
      
      autocompleteInstance.addListener("place_changed", () => {
        const place = autocompleteInstance.getPlace();
        if (!place.address_components) return;

        fillAddressFromPlace(place);
      });
      
      setAutocomplete(autocompleteInstance);
    }
  }, [googleMapsLoaded]);
    
    // Helper function to get address component
    const getComponent = (type) => {
      const component = addressComponents.find(comp => comp.types.includes(type));
      return component ? component.long_name : "";
    };

    const formattedAddress = place.formatted_address;
    const country = getComponent("country");
    const province = getComponent("administrative_area_level_1");
    const city = getComponent("locality") || 
                getComponent("administrative_area_level_2") || 
                getComponent("postal_town");
    const postalCode = getComponent("postal_code");

    setFormData(prev => ({
      ...prev,
      address: formattedAddress,
      country: country || prev.country,
      province: province || prev.province,
      city: city || prev.city,
      zip_code: postalCode || prev.zip_code
    }));

    setLocationStatus({
      loading: false,
      error: null,
      success: true,
    });
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      const latLng = new window.google.maps.LatLng(latitude, longitude);
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latLng }, (results, status) => {
          if (status === "OK" && results[0]) {
            const place = results[0];
            fillAddressFromPlace(place);
            resolve();
          } else {
            reject(new Error("Geocoding failed"));
          }
        });
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      throw error;
    }
  };
  
  const fillAddressFromPlace = (place) => {
    const addressComponents = place.address_components;
    
    // Helper function to get address component
    const getComponent = (type) => {
      const component = addressComponents.find(comp => comp.types.includes(type));
      return component ? component.long_name : "";
    };
  
    // Extract all relevant address components
    const streetNumber = getComponent("street_number");
    const route = getComponent("route");
    const locality = getComponent("locality");
    const administrativeAreaLevel1 = getComponent("administrative_area_level_1");
    const administrativeAreaLevel2 = getComponent("administrative_area_level_2");
    const country = getComponent("country");
    const postalCode = getComponent("postal_code");
    const postalTown = getComponent("postal_town");
  
    // Construct the street address
    const streetAddress = [streetNumber, route].filter(Boolean).join(" ");
    
    // Determine city (prioritize locality, then administrative_area_level_2, then postal_town)
    const city = locality || administrativeAreaLevel2 || postalTown || "";
    
    // Determine province/state
    const province = administrativeAreaLevel1 || "";
  
    // Update form state with the extracted values
    setFormData(prev => ({
      ...prev,
      address: streetAddress || place.formatted_address,
      city: city,
      province: province,
      country: country || prev.country,
      zip_code: postalCode || prev.zip_code
    }));
  
    setLocationStatus({
      loading: false,
      error: null,
      success: true,
    });
  };
  
  const handleLocateMe = () => {
    setShowPermissionModal(true);
  };
  
  const confirmLocationAccess = (allow) => {
    setShowPermissionModal(false);
    if (!allow) return;
  
    if (!navigator.geolocation) {
      setLocationStatus({
        loading: false,
        error: "Geolocation is not supported by your browser",
        success: false,
      });
      return;
    }
  
    setLocationStatus({
      loading: true,
      error: null,
      success: false,
    });
  
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await reverseGeocode(latitude, longitude);
        } catch (error) {
          console.error("Error processing location:", error);
          setLocationStatus({
            loading: false,
            error: "Could not determine address from your location",
            success: false,
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to retrieve your location";
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = "Location access was denied";
        } else if (error.code === error.TIMEOUT) {
          errorMessage = "Location request timed out";
        }
        setLocationStatus({
          loading: false,
          error: errorMessage,
          success: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const geocodeAddress = async (address) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      
      return new Promise((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === "OK" && results.length > 0) {
            resolve({
              latitude: results[0].geometry.location.lat(),
              longitude: results[0].geometry.location.lng()
            });
          } else {
            reject(new Error("Address not found"));
          }
        });
      });
    } catch (error) {
      console.error("Geocoding error:", error);
      throw error;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.clinic_name) newErrors.clinic_name = "Clinic name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters";
    if (formData.password !== formData.confirm_password) newErrors.confirm_password = "Passwords do not match";
    if (!formData.country) newErrors.country = "Country is required";
    if (!formData.province) newErrors.province = "Province is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.address) newErrors.address = "Address is required";
    if (!formData.contact_number) newErrors.contact_number = "Contact number is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!validateForm()) return;
  
    setIsSubmitting(true);
  
    try {
      // First geocode the address to get coordinates
      const coordinates = await geocodeAddress(
        `${formData.address}, ${formData.city}, ${formData.province}, ${formData.country}`
      );
  
      if (!coordinates) {
        throw new Error("Could not determine location coordinates for this address");
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(formData.password, 10);
  
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.clinic_name,
            role: "veterinary",
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
  
      if (authError) {
        if (authError.message.includes("duplicate key value")) {
          throw new Error("An account with this email already exists.");
        }
        throw authError;
      }
  
      if (!authData.user) throw new Error("User creation failed");
  
      // Step 2: Create veterinary clinic first (without user_id)
      const clinicId = uuidv4();
      const { error: clinicError } = await supabase
        .from("veterinary_clinics")
        .insert([
          {
            id: clinicId,
            clinic_name: formData.clinic_name,
            address: formData.address,
            city: formData.city,
            zip_code: formData.zip_code,
            country: formData.country,
            province: formData.province,
            contact_number: formData.contact_number,
            email: formData.email,
            website: formData.website,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            is_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
  
      if (clinicError) throw clinicError;
  
      // Step 3: Create user in users table with clinic_id
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: authData.user.id,
          email: formData.email,
          first_name: formData.clinic_name,
          last_name: "",
          role: "veterinary",
          created_by_admin_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true,
          password_hash: hashedPassword,
          clinic_id: clinicId,
        });
  
      if (userError) throw userError;
  
      // Step 4: Update the veterinary clinic with the user_id
      const { error: clinicUpdateError } = await supabase
        .from("veterinary_clinics")
        .update({ user_id: authData.user.id })
        .eq("id", clinicId);
  
      if (clinicUpdateError) throw clinicUpdateError;
  
      setSuccess(true);
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        general: error.message || "An error occurred during registration",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={["places"]}
      onLoad={() => setGoogleMapsLoaded(true)}
      onError={(error) => console.error("Google Maps script failed to load", error)}
    >
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6">Register Veterinary Clinic</h1>
        
        {success ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>Veterinary clinic account created successfully!</p>
            <p>An email has been sent to {formData.email} with confirmation instructions.</p>
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  clinic_name: "",
                  email: "",
                  password: "",
                  confirm_password: "",
                  address: "",
                  city: "",
                  zip_code: "",
                  country: "",
                  province: "",
                  contact_number: "",
                  website: ""
                });
              }}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Another Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Clinic Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinic Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="clinic_name"
                  value={formData.clinic_name}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.clinic_name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.clinic_name && <p className="text-red-500 text-sm mt-1">{errors.clinic_name}</p>}
              </div>
    
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>
    
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>
    
              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.confirm_password ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.confirm_password && <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>}
              </div>
    
              {/* Location Button */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locationStatus.loading || !googleMapsLoaded}
                  className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {locationStatus.loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Locating...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {googleMapsLoaded ? 'Locate Me Automatically' : 'Loading Maps...'}
                    </>
                  )}
                </button>
                {locationStatus.error && (
                  <p className="mt-1 text-sm text-red-600">{locationStatus.error}</p>
                )}
                {locationStatus.success && (
                  <p className="mt-1 text-sm text-green-600">Location information filled successfully!</p>
                )}
                {!googleMapsLoaded && (
                  <p className="mt-1 text-sm text-yellow-600">Google Maps is loading, please wait...</p>
                )}
              </div>
    
              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.country ? 'border-red-500' : 'border-gray-300'}`}
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>
    
              {/* Province */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Province/State <span className="text-red-500">*</span>
                </label>
                {formData.country ? (
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.province ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select Province/State</option>
                    {availableProvinces.map(province => (
                      <option key={province} value={province}>{province}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  >
                    <option>Select Country first</option>
                  </select>
                )}
                {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
              </div>
    
              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City <span className="text-red-500">*</span>
                </label>
                {formData.country === "Philippines" && formData.province ? (
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="">Select City</option>
                    {availableCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
                  />
                )}
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>
    
              {/* Zip Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zip Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.zip_code ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.zip_code && <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>}
              </div>
    
              {/* Address */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  ref={autocompleteRef}
                  className={`w-full px-3 py-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Start typing your address..."
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
    
              {/* Contact Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md ${errors.contact_number ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.contact_number && <p className="text-red-500 text-sm mt-1">{errors.contact_number}</p>}
              </div>
    
              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
    
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}
    
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Account...' : 'Create Veterinary Account'}
              </button>
            </div>
          </form>
        )}
    
        {/* Permission Modal */}
        {showPermissionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full">
              <h3 className="font-bold text-lg mb-4">Location Access</h3>
              <p className="mb-6">
                Allow this application to access your current location to automatically fill your address details?
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => confirmLocationAccess(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Deny
                </button>
                <button
                  onClick={() => confirmLocationAccess(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Allow
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </LoadScript>
  );
