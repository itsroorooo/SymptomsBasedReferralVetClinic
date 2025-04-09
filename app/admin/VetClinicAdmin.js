"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import VetClinicAdd from "./VetClinicAdd";
import { createClient } from "../../utils/supabase/client";

const supabase = createClient();


export default function VetClinicAdmin({ searchTerm, handleAction, setSearchTerm }) {
  const [clinics, setClinics] = useState([]); // State to store fetched clinics
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [showClinicDetailsModal, setShowClinicDetailsModal] = useState(false);


  const handleViewClinicDetails = (clinic) => { // Added this function
    setSelectedClinic(clinic);
    setShowClinicDetailsModal(true);
  };

  // Fetch clinics from the database
  useEffect(() => {
    const fetchClinics = async () => {
      const { data, error } = await supabase
        .from("veterinary_clinics")
        .select("clinic_id, clinic_name, address, city, contact_number, clinic_email"); // Removed created_at
  
      if (error) {
        console.error("Error fetching clinics:", error.message);
      } else {
        setClinics(data);
      }
    };
  
    fetchClinics();
  }, []);

  const handleAddNewClinic = async (clinicData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newClinicWithId = {
          ...clinicData,
          id: Math.max(...users.map(u => u.id), 0) + 1
        };
        handleAction(newClinicWithId.id, "pending");
        resolve();
      }, 1000);
    });
  };

  return (
    <div className="ml-5 space-y-6">
      {/* Add Clinic Modal */}
      {showAddClinicModal && (
        <VetClinicAdd
          onAddClinic={() => {}}
          onClose={() => setShowAddClinicModal(false)}
        />
      )}

      {/* Clinic Details Modal */}
      {showClinicDetailsModal && selectedClinic && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Clinic Details</h2>
              <button
                onClick={() => setShowClinicDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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
              </button>
            </div>
            <div className="space-y-4">
              <p><strong>Clinic Name:</strong> {selectedClinic.clinic_name}</p>
              <p><strong>Address:</strong> {selectedClinic.address}</p>
              <p><strong>City:</strong> {selectedClinic.city}</p>
              <p><strong>Contact Number:</strong> {selectedClinic.contact_number}</p>
              <p><strong>Email:</strong> {selectedClinic.clinic_email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clinic Management Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Vet Clinics</h1>
          <button
            onClick={() => setShowAddClinicModal(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Clinic
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name of clinic or email..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Clinics Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Clinic Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Contact Number</th>
                <th className="py-3 px-4 text-left">City</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics.length > 0 ? (
                clinics.map((clinic) => (
                  <tr key={clinic.clinic_id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{clinic.clinic_name}</td>
                    <td className="py-3 px-4">{clinic.clinic_email}</td>
                    <td className="py-3 px-4">{clinic.contact_number}</td>
                    <td className="py-3 px-4">{clinic.city}</td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleViewClinicDetails(clinic)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No clinics found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}