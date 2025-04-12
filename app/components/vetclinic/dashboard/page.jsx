"use client";

import React, { useState, useEffect } from "react";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import SidebarNav from "../../../components/veterinary-clinic/SidebarNav";
import Header from "../../../components/veterinary-clinic/Header";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
========
import SidebarNav from "./sidebar"; // Updated path
import Header from "./headers"; // Updated path
>>>>>>>> Stashed changes:app/components/vetclinic/page.js

export default function VeterinaryDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const supabase = createClient();
  const router = useRouter();

  // Navigation items
  const navItems = [
<<<<<<<< Updated upstream:app/components/vetclinic/page.jsx
    { name: "Home", href: "/veterinary-clinic", icon: HomeIcon, current: true },
    { name: "Records", href: "/veterinary-clinic/records", icon: ClipboardDocumentListIcon, current: false },
    { name: "Appointments", href: "/veterinary-clinic/appointments", icon: CalendarIcon, current: false },
    { name: "Equipment", href: "/veterinary-clinic/equipment", icon: BeakerIcon, current: false },
========
    { name: "Home", href: "#", icon: HomeIcon, current: true },
    { name: "Records", href: "/vetclinic/records", icon: ClipboardDocumentListIcon, current: false },
    { name: "Appointments", href: "/vetclinic/appointments", icon: CalendarIcon, current: false },
    { name: "Equipment", href: "/vetclinic/equipment", icon: BeakerIcon, current: false },
>>>>>>>> Stashed changes:app/components/vetclinic/page.js
  ];

  // Verify authentication and role
  useEffect(() => {
    let mounted = true;
    let authSubscription;

    const verifyAuthAndRole = async () => {
      try {
        // Check active session first
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (sessionError || !session) {
          console.error("Session error or no session:", sessionError?.message);
          router.push("/login");
          return;
        }

        // Get user role
        const { data: userData, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        if (roleError || !userData) {
          console.error("Role fetch error:", roleError?.message);
          setAuthError("Failed to verify your permissions");
          return;
        }

        console.log("User role:", userData.role);

        // Handle routing based on role
        if (userData.role === "veterinary") {
          setLoading(false);
        } else if (userData.role === "pet_owner") {
          router.push("/dashboard");
        } else {
          setAuthError("You don't have permission to access this page");
          await supabase.auth.signOut();
          setTimeout(() => router.push("/login"), 3000);
        }
      } catch (err) {
        console.error("Verification error:", err);
        if (mounted) {
          setAuthError("An unexpected error occurred");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const setupAuthListener = () => {
      authSubscription = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;
        
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT") {
          router.push("/login");
        } else if (session) {
          verifyAuthAndRole();
        }
      }).data.subscription;
    };

    verifyAuthAndRole();
    setupAuthListener();

    return () => {
      mounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-gray-600">Verifying your credentials...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
          <p className="font-bold">Authentication Error</p>
          <p>{authError}</p>
          {authError.includes("permission") && (
            <p className="mt-2 text-sm">Redirecting to login page...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navItems={navItems}
      />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <svg
              className="h-6 w-6"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <h1 className="text-xl font-semibold text-gray-900 self-center">Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">Veterinary Dashboard</h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-4">
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
                            <div className="text-lg font-medium text-gray-900">12</div>
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
                            <div className="text-lg font-medium text-gray-900">7</div>
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
                            <div className="text-lg font-medium text-gray-900">5 Need Attention</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h2 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h2>
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
        </main>
      </div>
    </div>
  );
}