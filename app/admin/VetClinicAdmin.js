"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function VetClinicAdmin({ 
  searchTerm, 
  filteredUsers, 
  users, 
  handleAction,
  setSearchTerm 
}) {
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [showRequirementsModal, setShowRequirementsModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({
    key: "signupDate",
    direction: "descending"
  });

  // Sample requirements data
  const clinicRequirements = {
    1: [
      { name: "Business License.pdf", url: "/docs/license1.pdf" },
      { name: "Veterinary Certification.pdf", url: "/docs/cert1.pdf" }
    ],
    // ... other clinic requirements
  };

  const handleViewRequirements = (clinicId) => {
    setSelectedClinic(clinicId);
    setShowRequirementsModal(true);
  };

  // Apply status filter
  const filteredByStatus = filteredUsers?.filter(user => {
    if (statusFilter === "all") return true;
    return user.status === statusFilter;
  });

  // Apply sorting
  const sortedUsers = [...(filteredByStatus || [])].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "ascending" ? "↑" : "↓";
  };

  return (
    <div className="ml-5 space-y-6">
      {/* Requirements Modal */}
      {showRequirementsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Uploaded Requirements</h2>
              <button 
                onClick={() => setShowRequirementsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {clinicRequirements[selectedClinic]?.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium">{file.name}</span>
                  </div>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Statistics Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Vet Clinic Statistics
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Total Clinics</h3>
            <p className="text-2xl font-bold">
              {users.length}
            </p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">Pending Approval</h3>
            <p className="text-2xl font-bold">
              {users.filter((u) => u.status === "pending").length}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Approved Clinics</h3>
            <p className="text-2xl font-bold">
              {users.filter((u) => u.status === "approved").length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Rejected Clinics</h3>
            <p className="text-2xl font-bold">
              {users.filter((u) => u.status === "rejected").length}
            </p>
          </div>
        </div>
      </div>

      {/* Sign-Up Validation Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Vet Clinic Sign-Up Validation
        </h1>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by name of clinic or email..."
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <div className="flex gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <select
              value={`${sortConfig.key}-${sortConfig.direction}`}
              onChange={(e) => {
                const [key, direction] = e.target.value.split("-");
                setSortConfig({ key, direction });
              }}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="signupDate-descending">Newest First</option>
              <option value="signupDate-ascending">Oldest First</option>
              <option value="name-ascending">Name (A-Z)</option>
              <option value="name-descending">Name (Z-A)</option>
            </select>
          </div>
        </div>

        {/* Vet Clinics Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th 
                  className="py-3 px-4 text-left cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  Clinic Name {getSortIndicator("name")}
                </th>
                <th className="py-3 px-4 text-left">Email</th>
                <th 
                  className="py-3 px-4 text-left cursor-pointer"
                  onClick={() => requestSort("signupDate")}
                >
                  Sign-Up Date {getSortIndicator("signupDate")}
                </th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Requirements</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedUsers?.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">{user.signupDate}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.status === "approved" ? "bg-green-100 text-green-800" :
                      user.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleViewRequirements(user.id)}
                      className="text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View
                    </button>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    {user.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleAction(user.id, "approved")}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(user.id, "rejected")}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}