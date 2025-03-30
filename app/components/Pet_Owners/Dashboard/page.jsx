"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Sidebar from "../Sidebar/page";
import { logout } from "@/app/logout/actions";

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State to control sidebar visibility
  const [activeComponent, setActiveComponent] = useState("Dashboard");

  // Toggle sidebar function
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true); // Always show sidebar on larger screens
      } else {
        setIsSidebarOpen(false); // Hide sidebar on smaller screens
      }
    };

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Initial check on component mount
    handleResize();

    // Cleanup event listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="font-[Poppins] h-screen">
      {/* Sidebar Toggle Button (Visible on Mobile) */}
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
        {/* Sidebar */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          setActiveComponent={setActiveComponent}
        />
      </div>

      {/* Header Section */}
      <header className="shadow-md py-4 px-4 md:px-10">
        <div className="flex items-center justify-between">
          {/* Title on the Left (Visible on Mobile) */}
          <div className="flex items-center space-x-4">
            <h1 className=" ml-68 text-2xl font-bold text-blue-500">Home</h1>
          </div>

          {/* Card on the Right */}
          <div className="relative flex items-center space-x-4">
            {/* Dropdown Toggle using Checkbox */}
            <div className="relative">
              {/* Hidden Checkbox */}
              <input
                type="checkbox"
                id="dropdownToggle"
                className="hidden peer"
              />

              {/* Avatar Button */}
              <label htmlFor="dropdownToggle">
                <Image
                  src="/image/megan.jpg"
                  alt="Avatar dropdown"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full cursor-pointer"
                />
              </label>

              {/* Dropdown Menu */}
              <div className="hidden peer-checked:block absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44 dark:bg-gray-700 dark:divide-gray-600">
                <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  <div>Bonnie Green</div>
                  <div className="font-medium truncate">name@flowbite.com</div>
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
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Earnings
                    </a>
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
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex justify-center items-center ml-0 md:ml-60 p-6">
        {activeComponent === "symptoms" && (
          <SymptomsList onSubmit={handleSymptomsSubmit} />
        )}
        {activeComponent === "Dashboard" && <div>Home Content</div>}
        {activeComponent === "pet" && <div>Pet Content</div>}
        {activeComponent === "appointment" && <div>Appointment Content</div>}
        {activeComponent === "logs" && <div>Logs Content</div>}
        {activeComponent === "map" && <VetMap />}
      </div>
    </div>
  );
};

export default Dashboard;
