"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";
import "leaflet/dist/leaflet.css";

// Dynamic imports for Leaflet (for SSR compatibility)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const ClinicMarker = dynamic(() => import("./ClinicMarker"), { ssr: false });

const VetMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const mapRef = React.useRef(null);

  // Fetch user session and clinics
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch verified veterinary clinics with their equipment
        const { data: clinicsData, error } = await supabase
          .from("veterinary_clinics")
          .select(`
            *,
            clinic_equipment:clinic_equipment(
              equipment:equipment(*),
              is_available,
              quantity
            ),
            schedules:veterinary_schedules(*),
            holidays:veterinary_holidays(*)
          `)
          .eq("is_verified", true)
          .order("clinic_name", { ascending: true });

        if (error) throw error;

        setClinics(clinicsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handleClinicClick = (clinicId) => {
    router.push(`/clinics/${clinicId}`);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Icon icon="eos-icons:loading" className="text-4xl text-blue-500 mb-2" />
          <p className="text-gray-600">Loading veterinary clinics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans h-screen bg-gray-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-md py-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-4">
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome,</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div className="relative group">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer">
                <Icon icon="heroicons:user-circle" className="text-blue-600 text-xl" />
              </div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => router.push("/profile")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area - Just the Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={[14.5995, 120.9842]} // Default to Manila coordinates
          zoom={13}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {clinics.map((clinic) => (
            <ClinicMarker
              key={clinic.id}
              clinic={clinic}
              onClick={handleClinicClick}
              highlight={false}
            />
          ))}
        </MapContainer>

        {/* Map Controls */}
        <div className="absolute bottom-4 right-4 z-[1000] bg-white p-2 rounded-md shadow-md">
          <button
            onClick={() => navigator.geolocation.getCurrentPosition(
              (pos) => {
                mapRef.current?.flyTo(
                  [pos.coords.latitude, pos.coords.longitude],
                  15
                );
              },
              (err) => console.error("Geolocation error:", err)
            )}
            className="p-2 hover:bg-gray-100 rounded"
            title="Locate me"
          >
            <Icon icon="mdi:crosshairs-gps" className="text-gray-700 text-xl" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VetMap;