"use client";

import React, { useState, useEffect } from "react";
import VetClinicAdd from "./VetClinicAdd";
import { createClient } from "../../utils/supabase/client";

const supabase = createClient();

const DeleteConfirmationModal = ({ clinic, onConfirm, onCancel }) => {
  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full animate-pop-in">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">Confirm Deletion</h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete <span className="font-semibold">{clinic.clinic_name}</span>? 
            This action cannot be undone.
          </p>
          
          <div className="flex justify-center space-x-4">
            <button
              onClick={onCancel}
              className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              Delete Clinic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VetClinicAdmin({ searchTerm, handleAction, setSearchTerm }) {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showAddClinicModal, setShowAddClinicModal] = useState(false);
  const [showClinicDetailsModal, setShowClinicDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clinicToDelete, setClinicToDelete] = useState(null);

  // Fetch clinics from the database
  useEffect(() => {
    fetchClinics();
  }, []);

  const fetchClinics = async () => {
    const { data, error } = await supabase
      .from("veterinary_clinics")
      .select("id, clinic_name, address, city, contact_number, email");

    if (error) {
      console.error("Error fetching clinics:", error.message);
    } else {
      setClinics(data);
    }
  };

  const handleViewClinicDetails = (clinic) => {
    setSelectedClinic(clinic);
    setShowClinicDetailsModal(true);
  };

  const handleDeleteClick = (clinic) => {
    setClinicToDelete(clinic);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const { error } = await supabase
        .from("veterinary_clinics")
        .delete()
        .eq("id", clinicToDelete.id);

      if (error) throw error;

      // Update UI by removing the deleted clinic
      setClinics(clinics.filter(clinic => clinic.id !== clinicToDelete.id));
    } catch (error) {
      console.error("Error deleting clinic:", error.message);
    } finally {
      setShowDeleteModal(false);
      setClinicToDelete(null);
    }
  };

  const handleAddNewClinic = async (clinicData) => {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newClinicWithId = {
          ...clinicData,
          id: Math.max(...clinics.map(c => c.id), 0) + 1
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
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
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
              <p><strong>Email:</strong> {selectedClinic.email}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && clinicToDelete && (
        <DeleteConfirmationModal
          clinic={clinicToDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
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
                <th className="py-3 px-4 text-left">Address</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics.length > 0 ? (
                clinics.map((clinic) => (
                  <tr key={clinic.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{clinic.clinic_name || "N/A"}</td>
                    <td className="py-3 px-4">{clinic.email || "N/A"}</td>
                    <td className="py-3 px-4">{clinic.contact_number || "N/A"}</td>
                    <td className="py-3 px-4">{clinic.address || "N/A"}</td>
                    <td className="py-3 px-4 space-x-2">
                      <button
                        onClick={() => handleViewClinicDetails(clinic)}
                        className="text-blue-500 hover:text-blue-700"
                        title="View Details"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(clinic)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete Clinic"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-gray-500">
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