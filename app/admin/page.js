"use client";

import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import VetClinicAdmin from "./VetClinicAdmin";
import UserAdmin from "./UserAdmin";
import { createClient } from "../../utils/supabase/client"; // Import the named export

const supabase = createClient(); // Initialize the Supabase client

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [vetClinics, setVetClinics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("home");
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    totalVetClinics: 0,
  });

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from("pet_owner_profiles") // Replace with your actual table name
          .select("*");
        if (usersError) throw usersError;
        setUsers(usersData);

        // Fetch vet clinics
        const { data: clinicsData, error: clinicsError } = await supabase
          .from("vetenirary_clinics") // Replace with your actual table name
          .select("*");
        if (clinicsError) throw clinicsError;
        setVetClinics(clinicsData);

        // Update stats
        setStats({
          totalUsers: usersData.length,
          activeUsers: usersData.filter((user) => user.status === "active").length,
          pendingApprovals: usersData.filter((user) => user.status === "pending").length,
          totalVetClinics: clinicsData.length,
        });
      } catch (error) {
        console.error("Error fetching data from Supabase:", error.message);
      }
    };

    fetchData();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleSetActiveComponent = (component) => {
    setActiveComponent(component);
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `#${component}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-md md:hidden"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 6h16M4 12h16m-7 6h7"
          ></path>
        </svg>
      </button>

      <div className="flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setActiveComponent={handleSetActiveComponent}
        />
      </div>

      <div className="ml-64">
        {activeComponent === "home" && (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Dashboard Statistics</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-100 rounded-lg">
                <h2 className="text-lg font-semibold">Total Users</h2>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <div className="p-4 bg-green-100 rounded-lg">
                <h2 className="text-lg font-semibold">Active Users</h2>
                <p className="text-2xl font-bold">{stats.activeUsers}</p>
              </div>
              <div className="p-4 bg-yellow-100 rounded-lg">
                <h2 className="text-lg font-semibold">Pending Approvals</h2>
                <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-lg">
                <h2 className="text-lg font-semibold">Total Vet Clinics</h2>
                <p className="text-2xl font-bold">{stats.totalVetClinics}</p>
              </div>
            </div>
          </div>
        )}
        {activeComponent === "vet" && (
          <VetClinicAdmin
            searchTerm={searchTerm}
            filteredUsers={vetClinics.filter(
              (clinic) =>
                clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                clinic.email.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            users={vetClinics}
            handleAction={(id, action) =>
              setVetClinics(
                vetClinics.map((clinic) =>
                  clinic.id === id ? { ...clinic, status: action } : clinic
                )
              )
            }
            setSearchTerm={setSearchTerm}
          />
        )}
        {activeComponent === "user" && (
          <UserAdmin
            users={users.filter(
              (user) =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            handleAction={(id, action) =>
              setUsers(
                users.map((user) =>
                  user.id === id ? { ...user, status: action } : user
                )
              )
            }
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        )}
      </div>
    </div>
  );
}