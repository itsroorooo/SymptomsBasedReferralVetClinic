"use client";

import React, { useState, useEffect } from "react";
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import VetSidebar from "../sidebar/page";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

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
                  Veterinary Dashboard
                </h1>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                  {/* Dashboard content */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Stats Card - Appointments Today */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <CalendarIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Appointments Today
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  12
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Card - Pending Records */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Pending Records
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  7
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Card - Equipment Status */}
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                      <div className="p-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BeakerIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-5 w-0 flex-1">
                            <dl>
                              <dt className="text-sm font-medium text-gray-500 truncate">
                                Equipment Status
                              </dt>
                              <dd>
                                <div className="text-lg font-medium text-gray-900">
                                  5 Need Attention
                                </div>
                              </dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="mt-8">
                    <h2 className="text-lg leading-6 font-medium text-gray-900">
                      Recent Activity
                    </h2>
                    <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {[1, 2, 3, 4, 5].map((item) => (
                          <li key={item}>
                            <a href="#" className="block hover:bg-gray-50">
                              <div className="px-4 py-4 sm:px-6">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-indigo-600 truncate">
                                    Patient Visit #{item}
                                  </p>
                                  <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                      Completed
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="flex items-center text-sm text-gray-500">
                                      Max (Golden Retriever)
                                    </p>
                                  </div>
                                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <p>Today at {10 + item}:00 AM</p>
                                  </div>
                                </div>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default VetClinicDashboard;
