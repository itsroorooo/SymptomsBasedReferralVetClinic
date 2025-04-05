// Sidebar.js
"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

const Sidebar = ({ isSidebarOpen, toggleSidebar, setActiveComponent }) => {
  return (
    <aside
      id="sidebar"
      className={`fixed inset-y-0 left-0 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 z-40`}
    >
      <button
        onClick={toggleSidebar}
        className="p-4 text-white md:hidden"
      >
        Close
      </button>
      {/* Logo */}
      <div className="p-4">
        <Image
          src="/image/Logoblue.png"
          alt="SymptoVet Logo"
          width={112}
          height={112}
          className="mx-12 mt-8 w-28 h-28"
        />
      </div>

      {/* Text */}
      <div className="px-4">
        <span className="text-3xl font-bold mx-6 pt-4">
          <span className="text-white">Sympto</span>
          <span className="text-blue-500">Vet</span>
        </span>
      </div>

      {/* Navigation Bar */}
      <nav className="mt-24 px-6">
        {/* Dashboard Link */}
        <button
          onClick={() => setActiveComponent("home")}
          className="group flex items-center py-3 px-6 rounded transition duration-200 hover:bg-blue-500 text-lg text-white w-full text-left"
        >
          <svg
            className="w-6 h-6 mr-3 group-hover:fill-white"
            viewBox="0 0 24 24"
            fill="#2196F3"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dashboard icon path */}
          </svg>
          Dashboard
        </button>

        {/* Vet Clinics Link */}
        <button
          onClick={() => setActiveComponent("vet")}
          className="group flex items-center py-3 px-6 rounded transition duration-200 hover:bg-blue-500 text-lg text-white w-full text-left"
        >
          <svg
            className="w-6 h-6 mr-3 group-hover:fill-white"
            viewBox="0 0 24 24"
            fill="#2196F3"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vet icon path */}
          </svg>
          Vet Clinics
        </button>

        {/* Users Link */}
        <button
          onClick={() => setActiveComponent("user")}
          className="group flex items-center py-3 px-6 rounded transition duration-200 hover:bg-blue-500 text-lg text-white w-full text-left"
        >
          <svg
            className="w-6 h-6 mr-3 group-hover:fill-white"
            fill="#2196F3"
            version="1.1"
            id="Capa_1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 63.445 63.445"
            xmlSpace="preserve"
          >
            {/* User icon path */}
          </svg>
          Users
        </button>

      </nav>

      {/* Underline */}
      <div className="flex items-center justify-center my-6 mt-28">
        <hr className="w-56 border-gray-400" />
      </div>
    </aside>
  );
};

export default Sidebar;