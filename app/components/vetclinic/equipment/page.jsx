"use client";

import React, { useState, useEffect } from "react";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PlusIcon } from "@heroicons/react/24/solid";
import { CheckCircle, Circle } from "react-feather";

const ClinicEquipmentManager = ({ clinicId }) => {
  const [equipmentList, setEquipmentList] = useState([]);
  const [clinicEquipment, setClinicEquipment] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customEquipment, setCustomEquipment] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [apiError, setApiError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    is_available: false
  });
  const [isProcessing, setIsProcessing] = useState(false); // Add processing state

  // Get selected equipment IDs
  const selectedEquipment = clinicEquipment
    .filter(item => item.is_standard)
    .map(item => item.equipment_id);

  // Fetch equipment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [equipResponse, clinicResponse] = await Promise.all([
          fetch('/api/vetclinic/equipment'),
          fetch(`/api/vetclinic/clinic-equipment?clinic_id=${clinicId}`)
        ]);

        if (!equipResponse.ok || !clinicResponse.ok) {
          throw new Error("Failed to fetch equipment data");
        }

        const equipData = await equipResponse.json();
        const clinicData = await clinicResponse.json();

        setEquipmentList(equipData);
        setClinicEquipment(clinicData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId]);

  // Equipment selection toggle
  const handleEquipmentToggle = async (id) => {
    if (isProcessing) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    const isSelected = selectedEquipment.includes(id);
    const newSelected = isSelected 
      ? selectedEquipment.filter(item => item !== id)
      : [...selectedEquipment, id];

    try {
      const response = await fetch("/api/vetclinic/clinic-equipment/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          equipment_ids: newSelected,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update equipment selection");
      }

      // Update local state
      setClinicEquipment(prev => {
        if (isSelected) {
          return prev.filter(item => item.equipment_id !== id || !item.is_standard);
        } else {
          // Check if already exists to prevent duplicates
          const exists = prev.some(item => item.equipment_id === id && item.is_standard);
          if (exists) return prev;
          
          const equipment = equipmentList.find(e => e.id === id);
          return [
            ...prev,
            {
              id: `temp-${Date.now()}-${id}`, // More unique temp ID
              clinic_id: clinicId,
              equipment_id: id,
              equipment_name: equipment.name,
              equipment_description: equipment.description,
              is_available: true,
              is_standard: true
            }
          ];
        }
      });

      setSuccessMessage("Equipment selection updated successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Add custom equipment
  const handleAddCustomEquipment = async () => {
    if (!customEquipment.trim()) {
      setApiError("Equipment name is required");
      return;
    }
  
    try {
      const response = await fetch("/api/vetclinic/clinic-equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          equipment_name: customEquipment.trim(),
          equipment_description: customDescription.trim(),
          is_available: true
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add equipment");
      }
  
      const newEquipment = await response.json();
      
      setClinicEquipment(prev => [...prev, {
        ...newEquipment,
        is_standard: false
      }]);
      
      setCustomEquipment("");
      setCustomDescription("");
      setIsAddingCustom(false);
      
      setSuccessMessage("Equipment added successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Open edit modal
  const openEditModal = (equipment) => {
    setCurrentEquipment(equipment);
    setEditForm({
      name: equipment.equipment_name,
      description: equipment.equipment_description || '',
      is_available: equipment.is_available
    });
    setIsEditModalOpen(true);
  };

  // Handle edit form changes
  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Save edited equipment
  const handleSaveEdit = async () => {
    if (!currentEquipment) return;
    
    try {
      const url = `/api/vetclinic/clinic-equipment/${currentEquipment.id}`;
      
      // For standard equipment, only update availability
      const body = currentEquipment.is_standard
        ? { is_available: editForm.is_available }
        : {
            equipment_name: editForm.name,
            equipment_description: editForm.description,
            is_available: editForm.is_available
          };

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update equipment");
      }

      const updatedEquipment = await response.json();
      
      setClinicEquipment(prev =>
        prev.map(item =>
          item.id === currentEquipment.id
            ? { ...item, ...updatedEquipment }
            : item
        )
      );
      
      setSuccessMessage("Equipment updated successfully");
      setIsEditModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Delete equipment
  const handleDeleteEquipment = async () => {
    if (!currentEquipment) return;
    
    try {
      const response = await fetch(`/api/vetclinic/clinic-equipment/${currentEquipment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete equipment");
      }

      setClinicEquipment(prev => 
        prev.filter(item => item.id !== currentEquipment.id)
      );
      
      setSuccessMessage(
        currentEquipment.is_standard 
          ? "Equipment removed from clinic" 
          : "Equipment deleted successfully"
      );
      
      setIsDeleteModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setApiError(err.message);
    }
  };

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case true:
        return "bg-green-100 text-green-800";
      case false:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-4">Error: {error}</div>;
  }

  return (
    <div className="space-y-6 p-4 relative">
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md">
          {successMessage}
        </div>
      )}
      {apiError && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md">
          {apiError}
        </div>
      )}

      {/* Equipment Selection */}
      <div className="space-y-3">
        <label className="block text-lg font-semibold text-gray-800">
          Select available equipment
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-3 border-2 border-gray-200 rounded-xl scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
          {equipmentList.map((equipment) => {
            const isSelected = selectedEquipment.includes(equipment.id);
            const isProcessingItem = isProcessing && isProcessing === equipment.id;
            
            return (
              <div
                key={equipment.id}
                onClick={() => !isProcessingItem && handleEquipmentToggle(equipment.id)}
                className={`p-4 border-2 rounded-xl cursor-pointer flex items-start justify-between transition-all ${
                  isSelected
                    ? "bg-blue-50 border-blue-300 shadow-md"
                    : "bg-white border-gray-200 hover:border-blue-200"
                } ${
                  isProcessingItem ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{equipment.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {equipment.description || "No description available"}
                  </p>
                </div>
                {isSelected ? (
                  <CheckCircle className="text-blue-600 ml-2 flex-shrink-0 h-5 w-5" />
                ) : (
                  <Circle className="text-gray-400 ml-2 flex-shrink-0 h-5 w-5" />
                )}
              </div>
            );
          })}

          {/* Add Custom Equipment */}
          {!isAddingCustom ? (
            <div
              onClick={() => setIsAddingCustom(true)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer flex items-center justify-center hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center">
                <PlusIcon className="text-gray-500 mr-2 h-5 w-5" />
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
              <div className="flex space-x-2">
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
            </div>
          )}
        </div>
      </div>

      {/* Clinic Equipment Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Clinic Equipment</h3>
        
        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* Equipment Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {clinicEquipment
                .filter((equipment) => {
                  const nameMatch = equipment.equipment_name
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase());
                  return nameMatch;
                })
                .map((equipment) => (
                  <tr key={equipment.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {equipment.equipment_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {equipment.equipment_description || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(equipment.is_available)
                        }`}
                      >
                        {equipment.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => openEditModal(equipment)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setCurrentEquipment(equipment);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {clinicEquipment.length === 0 && (
            <div className="px-6 py-4 text-center text-sm text-gray-500">
              No equipment found
            </div>
          )}
        </div>
      </div>

      {/* Edit Equipment Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-300 mx-4"
            style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Equipment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    disabled={currentEquipment?.is_standard}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      currentEquipment?.is_standard ? "bg-gray-100" : ""
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    disabled={currentEquipment?.is_standard}
                    rows={3}
                    className={`mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                      currentEquipment?.is_standard ? "bg-gray-100" : ""
                    }`}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_available"
                    name="is_available"
                    checked={editForm.is_available}
                    onChange={handleEditChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_available" className="ml-2 block text-sm text-gray-900">
                    Available
                  </label>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black bg-opacity-70 backdrop-blur-sm"
            onClick={() => setIsDeleteModalOpen(false)}
          ></div>
          <div 
            className="relative bg-white rounded-lg shadow-xl w-full max-w-md border border-gray-300 mx-4"
            style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            <div className="p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <TrashIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {currentEquipment?.is_standard ? "Remove" : "Delete"} Equipment
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to {currentEquipment?.is_standard ? "remove" : "delete"} "{currentEquipment?.equipment_name}"? 
                      {currentEquipment?.is_standard ? " It can be added back later." : " This action cannot be undone."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-4 py-3 flex justify-end space-x-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteEquipment}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                {currentEquipment?.is_standard ? "Remove" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClinicEquipmentManager;