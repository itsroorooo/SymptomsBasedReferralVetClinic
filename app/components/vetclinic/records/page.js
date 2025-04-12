"use client";
import React, { useState } from "react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import SidebarNav from "../../../components/veterinary-clinic/SidebarNav";
import Header from "../../../components/veterinary-clinic/Header";

export default function RecordsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);

  // Sample pet owners data (assume this is automatically saved from appointments)
  const initialPetOwners = [
    {
      id: 1,
      ownerName: "John Doe",
      petName: "Max",
      petType: "Dog",
      breed: "Golden Retriever",
      lastVisit: "2023-10-10",
    },
    {
      id: 2,
      ownerName: "Jane Smith",
      petName: "Bella",
      petType: "Cat",
      breed: "Siamese",
      lastVisit: "2023-09-25",
    },
    {
      id: 3,
      ownerName: "Alice Johnson",
      petName: "Charlie",
      petType: "Dog",
      breed: "Labrador",
      lastVisit: "2023-10-05",
    },
    {
      id: 4,
      ownerName: "Bob Brown",
      petName: "Lucy",
      petType: "Rabbit",
      breed: "Holland Lop",
      lastVisit: "2023-08-15",
    },
  ];

  // State for pet owners list and search term
  const [petOwners, setPetOwners] = useState(initialPetOwners);
  const [searchTerm, setSearchTerm] = useState("");

  // Navigation items
  const navItems = [
    { name: "Home", href: "/veterinary-clinic/dashboard", icon: HomeIcon, current: false },
    { name: "Records", href: "/veterinary-clinic/records", icon: ClipboardDocumentListIcon, current: true },
    { name: "Appointments", href: "/veterinary-clinic/appointments", icon: CalendarIcon, current: false },
    { name: "Equipment", href: "/veterinary-clinic/equipment", icon: BeakerIcon, current: false },
  ];

  // Handle search functionality
  const filteredPetOwners = petOwners.filter(
    (owner) =>
      owner.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner.petName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete pet owner (if needed)
  const handleDelete = (id) => {
    setPetOwners((prevList) => prevList.filter((owner) => owner.id !== id));
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} navItems={navItems} />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Pet Owners Records" />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search pet owners..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              {/* Pet Owners Table */}
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Owner Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pet Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pet Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Breed
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Visit
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredPetOwners.map((owner) => (
                        <tr key={owner.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {owner.ownerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {owner.petName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {owner.petType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {owner.breed}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {owner.lastVisit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex-1 ml-4">
                              <button
                                onClick={() => handleDelete(owner.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Pet Owners Count */}
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Total Pet Owners: {filteredPetOwners.length}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}