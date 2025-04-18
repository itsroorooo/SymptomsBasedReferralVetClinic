"use client";
import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, Plus, Edit, Trash2 } from "react-feather";

const ClinicEquipmentManager = ({ clinicId }) => {
  const [equipmentList, setEquipmentList] = useState([]); // List of all equipment
  const [selectedEquipment, setSelectedEquipment] = useState([]); // Selected equipment IDs
  const [clinicEquipment, setClinicEquipment] = useState([]); // Clinic-specific equipment
  const [isLoading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [customEquipment, setCustomEquipment] = useState(""); // Custom equipment name
  const [customDescription, setCustomDescription] = useState(""); // Custom equipment description
  const [isAddingCustom, setIsAddingCustom] = useState(false); // State for showing the custom equipment form
  const [successMessage, setSuccessMessage] = useState(""); // Success message
  const [apiError, setApiError] = useState(""); // API error message

  // Fetch equipment list and clinic equipment on component mount
  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const response = await fetch(`/api/vetclinic/equipment?clinic_id=${clinicId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch equipment");
        }
        const data = await response.json();
        const savedEquipment = data.filter((e) => e.is_saved).map((e) => e.id);
        setSelectedEquipment(savedEquipment);
        setEquipmentList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchClinicEquipment = async () => {
      try {
        const response = await fetch(`/api/vetclinic/clinic-equipment?clinic_id=${clinicId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch clinic equipment");
        }
        const data = await response.json();
        setClinicEquipment(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchEquipment();
    fetchClinicEquipment();
  }, [clinicId]);

  // Handle equipment selection toggle
  const handleEquipmentToggle = (id) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Add custom equipment
  const handleAddCustomEquipment = async () => {
    if (!customEquipment.trim()) {
      setApiError("Equipment name is required");
      return;
    }

    try {
      setApiError("");
      const response = await fetch("/api/vetclinic/clinic-equipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinic_id: clinicId,
          equipment_name: customEquipment.trim(),
          equipment_description: customDescription.trim() || null,
          is_available: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add custom equipment");
      }

      const newEquipment = await response.json();
      setClinicEquipment((prev) => [...prev, newEquipment]);
      setCustomEquipment("");
      setCustomDescription("");
      setIsAddingCustom(false);
      setSuccessMessage("Custom equipment added successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Delete equipment
  const handleDeleteEquipment = async (id) => {
    try {
      const response = await fetch(`/api/vetclinic/clinic-equipment/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete equipment");
      }

      setClinicEquipment((prev) => prev.filter((equipment) => equipment.id !== id));
      setSuccessMessage("Equipment deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Edit equipment availability
  const handleEditAvailability = async (id, isAvailable) => {
    try {
      const response = await fetch(`/api/vetclinic/clinic-equipment/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_available: !isAvailable }),
      });

      if (!response.ok) {
        throw new Error("Failed to update availability");
      }

      setClinicEquipment((prev) =>
        prev.map((equipment) =>
          equipment.id === id ? { ...equipment, is_available: !isAvailable } : equipment
        )
      );
      setSuccessMessage("Equipment availability updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Submit selected equipment
  const handleSubmitSelectedEquipment = async () => {
    try {
      setApiError("");

      const response = await fetch("/api/vetclinic/clinic-equipment/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clinic_id: clinicId,
          equipment_ids: selectedEquipment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save equipment selection");
      }

      setSuccessMessage("Equipment selection saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4">
      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {apiError}
        </div>
      )}

      {/* Equipment Selection */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-800">
          Select available equipment<span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-3 border-2 border-gray-200 rounded-xl scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
          {equipmentList.map((equipment) => (
            <div
              key={equipment.id}
              onClick={() => handleEquipmentToggle(equipment.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer flex items-start justify-between transition-all ${
                selectedEquipment.includes(equipment.id)
                  ? "bg-blue-50 border-blue-300 shadow-md"
                  : "bg-white border-gray-200 hover:border-blue-200"
              }`}
            >
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{equipment.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {equipment.description || "No description available"}
                </p>
              </div>
              {selectedEquipment.includes(equipment.id) ? (
                <CheckCircle className="text-blue-600 ml-2 flex-shrink-0 h-5 w-5" />
              ) : (
                <Circle className="text-gray-400 ml-2 flex-shrink-0 h-5 w-5" />
              )}
            </div>
          ))}

          {/* Add Custom Equipment Button */}
          {!isAddingCustom ? (
            <div
              onClick={() => setIsAddingCustom(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center">
                <Plus className="text-gray-500 mr-2 h-5 w-5" />
                <span className="font-medium text-gray-700">Add Custom Equipment</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                placeholder="Equipment Name"
                className="w-full p-2 border rounded-md"
              />
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Equipment Description"
                className="w-full p-2 border rounded-md"
              />
              <button
                onClick={handleAddCustomEquipment}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Add Equipment
              </button>
              <button
                onClick={() => setIsAddingCustom(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Clinic Equipment List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800">Clinic Equipment</h3>
        <div className="space-y-2">
          {clinicEquipment.map((equipment) => (
            <div
              key={equipment.id}
              className="p-4 border rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-semibold text-gray-800">{equipment.equipment_name}</p>
                <p className="text-sm text-gray-600">
                  {equipment.equipment_description || "No description available"}
                </p>
                <p className="text-sm text-gray-500">
                  Availability: {equipment.is_available ? "Available" : "Unavailable"}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditAvailability(equipment.id, equipment.is_available)}
                  className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteEquipment(equipment.id)}
                  className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmitSelectedEquipment}
          disabled={selectedEquipment.length === 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
            selectedEquipment.length === 0
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          Save Equipment Selection
        </button>
      </div>
    </div>
  );
};

export default ClinicEquipmentManager;