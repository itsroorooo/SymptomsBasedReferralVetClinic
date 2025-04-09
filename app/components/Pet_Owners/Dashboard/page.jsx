"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../Sidebar/page";
import { logout } from "@/app/logout/actions";
import PetsPage from "../Pet/page";
import SymptomsList from "../SymptomsList/page";
import { createClient } from "@/utils/supabase/client";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("Dashboard");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);

        // Get the current user's ID
        const { data: userData, error: authError } =
          await supabase.auth.getUser();
        if (authError || !userData?.user)
          throw new Error("User not authenticated");

        console.log("User ID:", userData.user.id); // Debugging

        // Fetch user profile using "id" instead of "user_id"
        const { data, error } = await supabase
          .from("pet_owner_profiles")
          .select("first_name, last_name, profile_picture_url")
          .eq("id", userData.user.id) // Ensuring correct ID field usage
          .single();

        if (error) throw error;

        // Ensure you use userData.user for id and email
        setUserProfile({
          id: userData.user.id,
          email: userData.user.email,
          first_name: data?.first_name || "",
          last_name: data?.last_name || "",
          profile_picture_url:
            data?.profile_picture_url || "/default-avatar.jpg",
        });
      } catch (err) {
        console.error("Error fetching profile:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] h-screen">
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

      {/* Sidebar Container */}
      <div className="flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setActiveComponent={setActiveComponent}
          activeComponent={activeComponent}
        />
      </div>

      {/* Header Section */}
      <header className="shadow-md py-4 px-4 md:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="ml-68 text-2xl font-bold text-blue-500">
              {activeComponent === "Dashboard" && "Home"}
              {activeComponent === "pet" && "My Pets"}
              {activeComponent === "appointment" && "Appointments"}

              {activeComponent === "map" && "Vet Map"}
              {activeComponent === "symptoms" && "SymptomsList"}
            </h1>
          </div>

          {/* User dropdown */}
          {userProfile && (
            <div className="relative flex items-center space-x-4">
              <div className="relative">
                <input
                  type="checkbox"
                  id="dropdownToggle"
                  className="hidden peer"
                />
                <label htmlFor="dropdownToggle">
                  <Image
                    src={userProfile.profile_picture_url}
                    alt="User profile"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full cursor-pointer"
                  />
                </label>

                <div className="hidden peer-checked:block absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600">
                  <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    <div>{`${userProfile.first_name} ${userProfile.last_name}`}</div>
                    <div className="font-medium truncate">
                      {userProfile.email}
                    </div>
                  </div>

                  <ul
                    className="py-2 text-sm text-gray-700 dark:text-gray-200"
                    aria-labelledby="dropdownToggle"
                  >
                    <li>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                      >
                        Settings
                      </Link>
                    </li>
                  </ul>

                  <div className="py-1">
                    <form action={logout}>
                      <button
                        type="submit"
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                      >
                        Logout
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-60 p-6 overflow-auto">
        {activeComponent === "Dashboard" && <div>Home Content</div>}
        {activeComponent === "pet" && <PetsPage />}
        {activeComponent === "appointment" && <div>Appointment Content</div>}
        {activeComponent === "map" && <VetMap />}
        {activeComponent === "symptoms" && <SymptomsList />}
      </main>
    </div>
  );
};

export default Dashboard;
