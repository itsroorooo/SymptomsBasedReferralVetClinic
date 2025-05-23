"use client";

import React, { useState, useEffect } from "react";
import VetSidebar from "../sidebar/page";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import HomePage from "../home/page";
import Image from "next/image";
import ManageSchedule from "../ManageSchedule/page";
import ClinicProfile from "../profile/page";
import ClinicEquipmentManager from "../equipment/page";
import PatientList from "../Patients/page";
import RealTimeAppointmentAlerts from "../appointments/page";

const VetClinicDashboard = () => {
  const [isVetSidebarOpen, setIsVetSidebar] = useState(false);
  const [activeComponent, setActiveComponent] = useState("VetDashboard");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [clinicProfile, setClinicProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [clinicId, setClinicId] = useState(null);

  const supabase = createClient();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsVetSidebar(!isVetSidebarOpen);
  };

  useEffect(() => {
    let mounted = true;

    const fetchUserData = async (userId) => {
      try {
        // Fetch user profile
        const { data: userData, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (profileError || !userData) {
          throw new Error(profileError?.message || "Profile not found");
        }

        if (mounted) {
          setUserProfile(userData);
        }

        // Fetch clinic profile if exists
        const { data: clinicData, error: clinicError } = await supabase
          .from("veterinary_clinics")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (mounted) {
          if (!clinicError && clinicData) {
            setClinicProfile(clinicData);
            setClinicId(clinicData.id);
          }
        }
      } catch (error) {
        console.error("Data fetch error:", error);
        if (mounted) {
          setAuthError(error.message);
        }
      }
    };

    const checkSession = async () => {
      try {
        setLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (!session) {
          throw new Error("No active session");
        }

        await fetchUserData(session.user.id);
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) {
          setAuthError(error.message);
          router.push("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const handleResize = () => {
      if (mounted) {
        setIsVetSidebar(window.innerWidth >= 768);
      }
    };

    // Set initial sidebar state based on window width
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [supabase, router]);

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="font-[Poppins] h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            Session Expired
          </h2>
          <p className="mb-4">Your session has expired. Please log in again.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="font-[Poppins] h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">
            User Not Found
          </h2>
          <p className="mb-4">Unable to load user profile.</p>
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] h-screen bg-gray-50">
      {/* Sidebar Toggle Button */}
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

      {/* Sidebar Overlay */}
      {isVetSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Layout */}
      <div className="flex h-full">
        {/* Sidebar Container */}
        <div
          className={`fixed md:static z-40 h-full transition-all duration-300 ease-in-out ${
            isVetSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0`}
        >
          <VetSidebar
            isVetSidebarOpen={isVetSidebarOpen}
            toggleSidebar={toggleSidebar}
            setActiveComponent={setActiveComponent}
            activeComponent={activeComponent}
            clinicProfile={clinicProfile}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
          {/* Header Section */}
          <header className="bg-white shadow-md py-4 px-4 md:px-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-blue-500">
                  {activeComponent === "VetDashboard" && "Home"}
                  {activeComponent === "Patients" && "Patients"}
                  {activeComponent === "Equipments" && "Equipments"}
                  {activeComponent === "Appointments" && "Appointments"}
                  {activeComponent === "Schedule" && "Manage Schedule"}
                  {activeComponent === "ClinicProfile" && "Clinic Profile"}
                </h1>
              </div>

              {/* User Dropdown */}
              <div className="relative flex items-center space-x-4">
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="focus:outline-none"
                  >
                    {clinicProfile?.logo_url ? (
                      <Image
                        src={clinicProfile.logo_url}
                        alt="Clinic logo"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full cursor-pointer object-cover"
                      />
                    ) : userProfile?.avatar_url ? (
                      <Image
                        src={userProfile.avatar_url}
                        alt="User profile"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full cursor-pointer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold cursor-pointer">
                        {userProfile?.first_name?.[0]}
                        {userProfile?.last_name?.[0]}
                      </div>
                    )}
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-64">
                      <div className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{`${
                          userProfile?.first_name || ""
                        } ${userProfile?.last_name || ""}`}</div>
                        <div className="truncate">
                          {userProfile?.email || ""}
                        </div>
                      </div>

                      <ul className="py-2 text-sm text-gray-700">
                        <li>
                          <button
                            onClick={() => {
                              setActiveComponent(
                                clinicProfile ? "ClinicProfile" : "UserProfile"
                              );
                              setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            {clinicProfile ? "Clinic Profile" : "User Profile"}
                          </button>
                        </li>
                        <li>
                          <button
                            onClick={() => {
                              setActiveComponent("Settings");
                              setIsDropdownOpen(false);
                            }}
                            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                          >
                            Settings
                          </button>
                        </li>
                        {clinicProfile && (
                          <li>
                            <button
                              onClick={() => {
                                setActiveComponent("Schedule");
                                setIsDropdownOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Manage Schedule
                            </button>
                          </li>
                        )}
                      </ul>

                      <div className="py-1">
                        <button
                          onClick={logout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {activeComponent === "VetDashboard" && <HomePage />}
            {activeComponent === "Patients" && <PatientList />}
            {activeComponent === "Equipments" && (
              <ClinicEquipmentManager clinicId={clinicId} />
            )}
            {activeComponent === "Appointments" && (
              <RealTimeAppointmentAlerts />
            )}
            {activeComponent === "Schedule" && clinicId && (
              <ManageSchedule clinicId={clinicId} />
            )}
            {activeComponent === "ClinicProfile" && clinicId && (
              <ClinicProfile clinicId={clinicId} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default VetClinicDashboard;
