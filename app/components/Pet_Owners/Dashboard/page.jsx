"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../Sidebar/page";
import { logout } from "@/app/logout/actions";
import PetsPage from "../Pet/page";
import SymptomsList from "../SymptomsList/page";
import { createClient } from "@/utils/supabase/client";
import VetMap from "../Map/page";
import { useRouter } from "next/navigation";
import ProfilePage from "../Profile/page";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeComponent, setActiveComponent] = useState("Dashboard");
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const verifyAndFetch = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: userData, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (roleError || userData?.role !== "pet_owner") {
          router.push(
            userData?.role === "veterinary" ? "/vetclinic" : "/login"
          );
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("pet_owner_profiles")
          .select("first_name, last_name, profile_picture_url")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setUserProfile({
          id: user.id,
          email: user.email,
          first_name: profileData?.first_name || "",
          last_name: profileData?.last_name || "",
          profile_picture_url:
            profileData?.profile_picture_url || "/default-avatar.jpg",
        });

        setRoleVerified(true);
      } catch (err) {
        console.error("Error:", err.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    verifyAndFetch();
  }, [router, supabase]);

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

  if (loading || !roleVerified) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="font-[Poppins] h-full min-h-screen bg-gray-100">
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

      {/* Main Layout Container */}
      <div className="flex h-full">
        {/* Sidebar - fixed width when open */}
        <div
          className={`${isSidebarOpen ? "w-64" : "w-0"} 
          transition-all duration-300 ease-in-out 
          fixed md:static z-40 h-full`}
        >
          <Sidebar
            isSidebarOpen={isSidebarOpen}
            toggleSidebar={toggleSidebar}
            setActiveComponent={setActiveComponent}
            activeComponent={activeComponent}
          />
        </div>

        {/* Content Area - adjusts margin based on sidebar */}
        <div
          className={`flex-1 flex flex-col h-full overflow-hidden 
          ${isSidebarOpen ? "md:ml-0" : "md:ml-0"}
          transition-all duration-300 ease-in-out`}
        >
          {/* Header */}
          <header className="shadow-md py-2 px-4 md:px-10 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold text-blue-500">
                  {activeComponent === "Dashboard" && "Home"}
                  {activeComponent === "pet" && "My Pets"}
                  {activeComponent === "appointment" && "Appointments"}
                  {activeComponent === "map" && "Available Clinics"}
                  {activeComponent === "symptoms" && "Report Pet Symptoms"}
                  {activeComponent === "profile" && "My Profile"}
                </h1>
              </div>

              {/* User Dropdown */}
              {userProfile && (
                <div className="relative flex items-center space-x-4">
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="focus:outline-none"
                    >
                      <Image
                        src={userProfile.profile_picture_url}
                        alt="User profile"
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full cursor-pointer"
                      />
                    </button>

                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44">
                        <div className="px-4 py-3 text-sm text-gray-900">
                          <div>{`${userProfile.first_name} ${userProfile.last_name}`}</div>
                          <div className="font-medium truncate">
                            {userProfile.email}
                          </div>
                        </div>

                        <ul className="py-2 text-sm text-gray-700">
                          <li>
                            <button
                              onClick={() => {
                                setActiveComponent("profile");
                                setIsDropdownOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Profile
                            </button>
                          </li>
                          <li>
                            <button
                              onClick={() => {
                                setActiveComponent("settings");
                                setIsDropdownOpen(false);
                              }}
                              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                            >
                              Settings
                            </button>
                          </li>
                        </ul>
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
                        href="/components/Pet_Owners/Settings"
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
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Logout
                            </button>
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto bg-gray-100">
            {activeComponent === "Dashboard" && <div>Home Content</div>}
            {activeComponent === "pet" && <PetsPage />}
            {activeComponent === "appointment" && (
              <div>Appointment Content</div>
            )}
            {activeComponent === "map" && <VetMap />}
            {activeComponent === "symptoms" && <SymptomsList />}
            {activeComponent === "profile" && (
              <ProfilePage
                onPhotoChange={(newUrl) => {
                  setUserProfile((prev) => ({
                    ...prev,
                    profile_picture_url: newUrl,
                  }));
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
