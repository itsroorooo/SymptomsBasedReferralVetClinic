"use client";
import React, { useState } from "react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import SidebarNav from "../../../components/veterinary-clinic/SidebarNav";
import Header from "../../../components/veterinary-clinic/Header";
export default function EquipmentPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: "",
    status: "Available",
  });
  const [editEquipment, setEditEquipment] = useState({
    id: null,
    name: "",
    status: "Available",
  });
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  // Sample equipment data
  const initialEquipment = [
    { id: 1, name: "X-Ray Machine", status: "Available" },
    { id: 2, name: "Ultrasound Scanner", status: "Under Maintenance" },
    { id: 3, name: "Anesthesia Machine", status: "Available" },
    { id: 4, name: "Dental Scaling Unit", status: "Not Available" },
    { id: 5, name: "Surgical Microscope", status: "Available" },
  ];

  // State for equipment list and search term
  const [equipmentList, setEquipmentList] = useState(initialEquipment);
  const [searchTerm, setSearchTerm] = useState("");

  // Navigation items
  const navItems = [
    { name: "Home", href: "/veterinary-clinic/dashboard", icon: HomeIcon, current: false },
    { name: "Records", href: "/veterinary-clinic/records", icon: ClipboardDocumentListIcon, current: false },
    { name: "Appointments", href: "/veterinary-clinic/appointments", icon: CalendarIcon, current: false },
    { name: "Equipment", href: "/veterinary-clinic/equipment", icon: BeakerIcon, current: true },
  ];

  // Handle search functionality
  const filteredEquipment = equipmentList.filter((equipment) =>
    equipment.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete equipment
  const handleDelete = (id) => {
    setEquipmentList((prevList) => prevList.filter((item) => item.id !== id));
    setIsDeleteModalOpen(false); // Close the delete confirmation modal
  };

  // Handle edit equipment
  const handleEdit = (equipment) => {
    setEditEquipment(equipment);
    setIsEditModalOpen(true);
  };

  // Handle update equipment
  const handleUpdateEquipment = (e) => {
    e.preventDefault();
    setEquipmentList((prevList) =>
      prevList.map((item) =>
        item.id === editEquipment.id ? { ...item, ...editEquipment } : item
      )
    );
    setIsEditModalOpen(false); // Close the edit modal
  };

  // Handle add new equipment
  const handleAddEquipment = (e) => {
    e.preventDefault();
    const newId = equipmentList.length + 1;
    setEquipmentList((prevList) => [
      ...prevList,
      { id: newId, ...newEquipment },
    ]);
    setIsModalOpen(false); // Close the modal
    setNewEquipment({ name: "", status: "Available" }); // Reset form
  };

  // Function to determine status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800"; // Green for Available
      case "Under Maintenance":
        return "bg-orange-100 text-orange-800"; // Orange for Under Maintenance
      case "Not Available":
        return "bg-red-100 text-red-800"; // Red for Not Available
      default:
        return "bg-gray-100 text-gray-800"; // Default gray
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} navItems={navItems} />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Equipment Inventory" />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
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
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEquipment.map((equipment) => (
                      <tr key={equipment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {equipment.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              equipment.status
                            )}`}
                          >
                            {equipment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleEdit(equipment)}
                            className="text-indigo-600 hover:text-indigo-900 mr-2"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setEquipmentToDelete(equipment.id);
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
              </div>

              {/* Add New Equipment Button */}
              <div className="mt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Add New Equipment
                </button>
              </div>

              {/* Total Equipment Count */}
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Total Equipment: {filteredEquipment.length}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal for Add New Equipment */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Equipment</h2>
            <form onSubmit={handleAddEquipment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Equipment Name
                </label>
                <input
                  type="text"
                  value={newEquipment.name}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={newEquipment.status}
                  onChange={(e) =>
                    setNewEquipment({ ...newEquipment, status: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-500 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Edit Equipment */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Equipment</h2>
            <form onSubmit={handleUpdateEquipment}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Equipment Name
                </label>
                <input
                  type="text"
                  value={editEquipment.name}
                  onChange={(e) =>
                    setEditEquipment({ ...editEquipment, name: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={editEquipment.status}
                  onChange={(e) =>
                    setEditEquipment({ ...editEquipment, status: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="Available">Available</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-500 text-white rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md"
                >
                  Update Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Delete Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-4">
              Are you sure you want to delete this equipment?
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="mr-2 px-4 py-2 bg-gray-500 text-white rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(equipmentToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}