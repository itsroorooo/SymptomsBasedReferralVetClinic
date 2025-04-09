import React, { useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClinic((prev) => {
      if (name === "province") {
        return { ...prev, [name]: value, city: "" };
      }
      if (name === "country") {
        return { ...prev, [name]: value, province: "", city: "" };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsAdding(true);

  try {
    // Generate a unique user_id for the clinic user
    const uniqueUserId = uuidv4();

    // Insert the user into the "users" table
    const { error: userInsertError } = await supabase.from("users").insert([
      {
        user_id: uniqueUserId, // Use the generated user_id
        role: "clinic", // Set the role to "clinic"
      },
    ]);

    if (userInsertError) {
      console.error("Error adding user to Supabase:", userInsertError.message);
      alert("Failed to add user. Please try again.");
      return;
    }

    // Generate a unique clinic_id for the veterinary clinic
    const uniqueClinicId = uuidv4();

    // Insert the clinic into the "veterinary_clinics" table
    const { error: clinicInsertError } = await supabase.from("veterinary_clinics").insert([
      {
        clinic_id: uniqueClinicId, // Use the generated clinic_id
        user_id: uniqueUserId, // Reference the user_id from the "users" table
        clinic_name: newClinic.clinic_name,
        address: newClinic.address,
        city: newClinic.city,
        zip_code: newClinic.zip_code,
        country: newClinic.country,
        province: newClinic.province,
        contact_number: newClinic.contact_number,
        clinic_email: newClinic.clinic_email, // Store email here
        clinic_password_hash: newClinic.clinic_password, // Store password hash here
        website_link: newClinic.website,
      },
    ]);

    if (clinicInsertError) {
      console.error("Error adding clinic to Supabase:", clinicInsertError.message);
      alert("Failed to add clinic. Please try again.");
      return;
    }

    await onAddClinic(newClinic);

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
    console.error("Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="text"
                  name="clinic_email"
                  value={newClinic.clinic_email}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <input
                  type="text"
                  name="clinic_password"
                  value={newClinic.clinic_password}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
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
                  {newClinic.country && countryProvinces[newClinic.country]?.map((province) => (
                    <option key={province} value={province}>{province}</option>
                  ))}
                </select>
              </div>
  
              {/* City - Now a dropdown for Philippines */}
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
  
              {/* Other fields remain the same */}
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
      </div>
    );
}