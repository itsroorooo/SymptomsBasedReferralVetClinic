"use client";

import React, { useState, useEffect } from "react";
import VetSidebar from "../sidebar/page";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import HomePage from "../home/page";

const VetClinicDashboard = () => {
  const [isVetSidebarOpen, setIsVetSidebar] = useState(false);
  const [activeComponent, setActiveComponent] = useState("VetDashboard");
  const supabase = createClient();
  const router = useRouter();

  const toggleSidebar = () => {
    setIsVetSidebar(!isVetSidebarOpen);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsVetSidebar(true);
      } else {
        setIsVetSidebar(false);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
                </h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            {activeComponent === "VetDashboard" && <HomePage />}
            {activeComponent === "pet" && <PetsPage />}
            {activeComponent === "appointment" && (
              <div>Appointment Content</div>
            )}
            {activeComponent === "map" && <VetMap />}
            {activeComponent === "symptoms" && <SymptomsList />}
          </main>
        </div>
      </div>
    </div>
  );
};

export default VetClinicDashboard;
