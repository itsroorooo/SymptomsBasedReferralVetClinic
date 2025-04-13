import React, { useState, useEffect } from "react";
import { createClient } from "../../utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";

const supabase = createClient();

// List of countries
const countries = [
    "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
    "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
    "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi", "Cabo Verde",
    "Cambodia", "Cameroon", "Canada", "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros", "Congo",
    "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic",
    "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea", "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland",
    "France", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada", "Guatemala", "Guinea", "Guinea-Bissau",
    "Guyana", "Haiti", "Honduras", "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy",
    "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kiribati", "Korea (North)", "Korea (South)", "Kuwait", "Kyrgyzstan",
    "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg", "Madagascar",
    "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
    "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal",
    "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria", "North Macedonia", "Norway", "Oman", "Pakistan", "Palau",
    "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
    "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia", "Saint Vincent and the Grenadines", "Samoa", "San Marino",
    "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Suriname",
    "Sweden", "Switzerland", "Syria", "Tajikistan", "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States",
    "Uruguay", "Uzbekistan", "Vanuatu", "Vatican City", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe"
  ];
  
  const philippineCitiesByProvince = {
      // National Capital Region (NCR)
      "Metro Manila": [
        "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong",
        "Manila", "Marikina", "Muntinlupa", "Navotas", "Parañaque",
        "Pasay", "Pasig", "Quezon City", "San Juan", "Taguig", "Valenzuela"
      ],
  
      // Agusan del Norte
      "Agusan del Norte": [
          "Butuan City", "Cabadbaran City", "Buenavista", "Carmen", "Jabonga",
          "Kitcharao", "Las Nieves", "Magallanes", "Nasipit", "Remedios T. Romualdez",
          "Santiago"
    ],
  };
  
  const countryProvinces = {
      "Philippines": [
        "Metro Manila", "Ilocos Norte", "Ilocos Sur", "La Union", "Pangasinan", 
        "Abra", "Apayao", "Benguet", "Ifugao", "Kalinga", 
        "Mountain Province", "Batanes", "Cagayan", "Isabela", "Nueva Vizcaya", 
        "Quirino", "Aurora", "Bataan", "Bulacan", "Nueva Ecija", 
        "Pampanga", "Tarlac", "Zambales", "Batangas", "Cavite", 
        "Laguna", "Quezon", "Rizal", "Marinduque", "Occidental Mindoro", 
        "Oriental Mindoro", "Palawan", "Romblon", "Albay", "Camarines Norte", 
        "Camarines Sur", "Catanduanes", "Masbate", "Sorsogon", "Aklan", 
        "Antique", "Capiz", "Guimaras", "Iloilo", "Negros Occidental", 
        "Bohol", "Cebu", "Negros Oriental", "Siquijor", "Biliran", 
        "Eastern Samar", "Leyte", "Northern Samar", "Samar", "Southern Leyte", 
        "Zamboanga del Norte", "Zamboanga del Sur", "Zamboanga Sibugay", "Isabela City", 
        "Bukidnon", "Camiguin", "Lanao del Norte", "Misamis Occidental", "Misamis Oriental", 
        "Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental", 
        "Cotabato", "Sarangani", "South Cotabato", "Sultan Kudarat", "Agusan del Norte",
        "Agusan del Sur", "Dinagat Islands", "Surigao del Norte", "Surigao del Sur", 
        "Basilan", "Lanao del Sur", "Maguindanao", "Sulu", "Tawi-Tawi"
      ],
  
      "Canada": [
        "Alberta", "British Columbia", "Manitoba", "New Brunswick",
        "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
        "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"
      ]
    };

    export default function VetClinicAdd({ onAddClinic, onClose }) {
      const [newClinic, setNewClinic] = useState({
        clinic_name: "",
        clinic_password: "",
        address: "",
        city: "",
        zip_code: "",
        country: "",
        province: "",
        contact_number: "",
        clinic_email: "",
        website: "",
      });
      const [isAdding, setIsAdding] = useState(false);
      const [locationStatus, setLocationStatus] = useState({
        loading: false,
        error: null,
        success: false,
      });
      const [showPermissionModal, setShowPermissionModal] = useState(false);
    
      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewClinic((prev) => ({
          ...prev,
          [name]: value,
        }));
      };
    
      const reverseGeocode = async (latitude, longitude) => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data.error) {
            throw new Error(data.error);
          }
          
          const address = data.address;
          
          // Parse address components
          let parsedAddress = "";
          const addressParts = [
            address.house_number,
            address.road,
            address.neighbourhood,
            address.suburb,
            address.pedestrian,
            address.footway
          ].filter(Boolean);
          
          parsedAddress = addressParts.join(", ") || "Unknown address";
          
          // Determine city
          const city = address.city || address.town || 
                      address.village || address.municipality || "";
          
          // Determine province/state
          const province = address.state || address.county || 
                          address.region || address.province || "";
          
          return {
            ...address,
            parsedAddress,
            city,
            province,
            country: address.country || ""
          };
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          throw error;
        }
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
              const address = await reverseGeocode(latitude, longitude);
              
              setNewClinic(prev => ({
                ...prev,
                country: address.country || prev.country,
                province: address.province || prev.province,
                city: address.city || prev.city,
                zip_code: address.postcode || prev.zip_code,
                address: address.parsedAddress || prev.address
              }));
              
              setLocationStatus({
                loading: false,
                error: null,
                success: true,
              });
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
            setLocationStatus({
              loading: false,
              error: "Unable to retrieve your location",
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
    
      const handleSubmit = async (e) => {
        e.preventDefault();
        setIsAdding(true);
      
        try {
          // First geocode the address to get coordinates
          const coordinates = await geocodeAddress(
            `${newClinic.address}, ${newClinic.city}, ${newClinic.province}, ${newClinic.country}`
          );
    
          if (!coordinates) {
            throw new Error("Could not determine location coordinates for this address");
          }
    
          const hashedPassword = await bcrypt.hash(newClinic.clinic_password, 10);
          const uniqueUserId = uuidv4();
    
          // Insert user
          const { error: userInsertError } = await supabase.from("users").insert([
            {
              id: uniqueUserId,
              email: newClinic.clinic_email,
              password_hash: hashedPassword,
              role: "veterinary",
            },
          ]);
          
          if (userInsertError) throw userInsertError;
    
          const uniqueClinicId = uuidv4();
          
          // Insert clinic with geocoded coordinates
          const { error: clinicInsertError } = await supabase.from("veterinary_clinics").insert([
            {
              id: uniqueClinicId,
              user_id: uniqueUserId,
              clinic_name: newClinic.clinic_name,
              address: newClinic.address,
              city: newClinic.city,
              zip_code: newClinic.zip_code,
              country: newClinic.country,
              province: newClinic.province,
              contact_number: newClinic.contact_number,
              email: newClinic.clinic_email,
              website: newClinic.website,
              latitude: coordinates.latitude,
              longitude: coordinates.longitude,
              is_verified: false // New clinics should be verified by admin
            },
          ]);
          
          if (clinicInsertError) throw clinicInsertError;
    
          onAddClinic({
            ...newClinic,
            id: uniqueClinicId,
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          });
    
          // Reset form
          setNewClinic({
            clinic_name: "",
            clinic_password: "",
            address: "",
            city: "",
            zip_code: "",
            country: "",
            province: "",
            contact_number: "",
            clinic_email: "",
            website: "",
          });
          
          onClose();
        } catch (error) {
          console.error("Error:", error);
          alert(error.message || "An error occurred. Please try again.");
        } finally {
          setIsAdding(false);
        }
      };
    
      const getCities = () => {
        if (newClinic.country === "Philippines" && newClinic.province) {
          return philippineCitiesByProvince[newClinic.province] || [];
        }
        return [];
      };
    
      const cities = getCities();
    
      return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-gray-200 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>
    
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-y-auto max-h-[90vh]">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">Add New Clinic</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
    
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Clinic Name */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Clinic Name *
                  </label>
                  <input
                    type="text"
                    name="clinic_name"
                    value={newClinic.clinic_name}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Email */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="clinic_email"
                    value={newClinic.clinic_email}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="clinic_password"
                    value={newClinic.clinic_password}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Location Button */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <button
                    type="button"
                    onClick={handleLocateMe}
                    disabled={locationStatus.loading}
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
                        Locate Me Automatically
                      </>
                    )}
                  </button>
                  {locationStatus.error && (
                    <p className="mt-1 text-sm text-red-600">{locationStatus.error}</p>
                  )}
                  {locationStatus.success && (
                    <p className="mt-1 text-sm text-green-600">Location information filled successfully!</p>
                  )}
                </div>
    
                {/* Country */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Country *
                  </label>
                  <select
                    name="country"
                    value={newClinic.country}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>Select a country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
    
                {/* Province */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Province *
                  </label>
                  <select
                    name="province"
                    value={newClinic.province}
                    onChange={handleInputChange}
                    required
                    disabled={!newClinic.country || !countryProvinces[newClinic.country]}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="" disabled>
                      {!newClinic.country
                        ? "Select a country first"
                        : !countryProvinces[newClinic.country]
                        ? "No provinces available"
                        : "Select a province"}
                    </option>
                    {newClinic.country &&
                      countryProvinces[newClinic.country]?.map((province) => (
                        <option key={province} value={province}>{province}</option>
                      ))}
                  </select>
                </div>
    
                {/* City */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  {newClinic.country === "Philippines" ? (
                    <select
                      name="city"
                      value={newClinic.city}
                      onChange={handleInputChange}
                      required
                      disabled={!newClinic.province || cities.length === 0}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>
                        {!newClinic.province
                          ? "Select a province first"
                          : cities.length === 0
                          ? "No cities available"
                          : "Select a city"}
                      </option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="city"
                      value={newClinic.city}
                      onChange={handleInputChange}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  )}
                </div>
    
                {/* Zip Code */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Zip Code *
                  </label>
                  <input
                    type="text"
                    name="zip_code"
                    value={newClinic.zip_code}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Address */}
                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newClinic.address}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Contact Number */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Contact Number *
                  </label>
                  <input
                    type="text"
                    name="contact_number"
                    value={newClinic.contact_number}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
    
                {/* Website */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Website
                  </label>
                  <input
                    type="text"
                    name="website"
                    value={newClinic.website}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
    
              {/* Modal Footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isAdding ? "Adding..." : "Add Clinic"}
                </button>
              </div>
            </form>
          </div>
    
          {/* Permission Modal */}
          {showPermissionModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
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
      );
    }
    export const geocodeAddress = async (address) => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
        );
        const data = await response.json();
        
        if (data.length > 0) {
          return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
          };
        }
        return null;
      } catch (error) {
        console.error("Geocoding error:", error);
        return null;
      }
    };
