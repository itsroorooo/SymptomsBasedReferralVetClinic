'use client';

import Image from 'next/image';
import { useState } from 'react';

export default function SidebarNav({ sidebarOpen, setSidebarOpen, navItems }) {
  const [activeNav, setActiveNav] = useState(navItems.find((item) => item.current)?.name || '');

  const handleNavClick = (name) => {
    setActiveNav(name);
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity duration-300 lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col z-40 w-64 max-w-xs transform transition duration-300 ease-in-out bg-gray-900 lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Name */}
        <div className="p-4 flex flex-col items-center">
          <Image
            src="/image/Logoblue.png"
            alt="SymptoVet Logo"
            width={112}
            height={112}
            className="w-28 h-28"
          />
          <span className="text-3xl font-bold mt-4">
            <span className="text-white">Sympto</span>
            <span className="text-blue-500">Vet</span>
          </span>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 px-2 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => handleNavClick(item.name)}
                className={`group flex items-center px-4 py-3 text-lg font-medium rounded-md ${
                  activeNav === item.name
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-4 h-8 w-8 ${
                    activeNav === item.name
                      ? 'text-white'
                      : 'text-blue-500 group-hover:text-white'
                  }`}
                />
                <span>{item.name}</span>
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-900">
          {/* Logo and Name */}
          <div className="p-4 flex flex-col items-center">
            <Image
              src="/image/Logoblue.png"
              alt="SymptoVet Logo"
              width={112}
              height={112}
              className="w-28 h-28"
            />
            <span className="text-3xl font-bold mt-4">
              <span className="text-white">Sympto</span>
              <span className="text-blue-500">Vet</span>
            </span>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => handleNavClick(item.name)}
                  className={`group flex items-center px-4 py-3 text-lg rounded-md ${
                    activeNav === item.name
                      ? 'bg-blue-500 text-white'
                      : 'text-white hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-4 h-8 w-8 ${
                      activeNav === item.name
                        ? 'text-white'
                        : 'text-blue-500 group-hover:text-white'
                    }`}
                  />
                  <span>{item.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}