"use client";

import { useState } from "react";
import { 
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon 
} from "@heroicons/react/24/outline";
import SidebarNav from "../components/vetclinic/SidebarNav";
import Header from "../components/vetclinic/headers/page";

export default function PetDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { 
      name: "Home", 
      href: "/pet-dashboard", 
      icon: HomeIcon, 
      current: true 
    },
    { 
      name: "Records", 
      href: "/pet-dashboard/records", 
      icon: ClipboardDocumentListIcon, 
      current: false 
    },
    { 
      name: "Appointments", 
      href: "/pet-dashboard/appointments", 
      icon: CalendarIcon, 
      current: false 
    },
    { 
      name: "Health", 
      href: "/pet-dashboard/health", 
      icon: BeakerIcon, 
      current: false 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <SidebarNav
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
      />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Pet Dashboard"
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-semibold text-gray-900">Pet Dashboard</h1>
          </div>
        </main>
      </div>
    </div>
  );
}