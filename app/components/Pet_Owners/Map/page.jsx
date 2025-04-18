"use client";

import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";
import "leaflet/dist/leaflet.css";

// Dynamically import Leaflet and its components
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import("react-leaflet").then((mod) => mod.CircleMarker),
  { ssr: false }
);

// Dynamically import Leaflet for custom icons
const L = typeof window !== "undefined" ? require("leaflet") : null;

// Create a custom red icon
const createRedIcon = () => {
  return new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

const geocodeAddress = async (clinic) => {
  try {
    const fullAddress = `${clinic.address}, ${clinic.city}, ${clinic.zip_code}, ${clinic.country}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`
    );
    const data = await response.json();
    
    if (data.length > 0) {
      return {
        ...clinic,
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon)
      };
    }
    return clinic;
  } catch (error) {
    console.error("Geocoding error:", error);
    return clinic;
  }
};

const VetMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const mapRef = useRef(null);
  const markerRefs = useRef({});

  const BUTUAN_CENTER = [8.9475, 125.5406];
  const DEFAULT_ZOOM = 13;

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const { data: clinicsData, error } = await supabase
          .from("veterinary_clinics")
          .select(`
            id,
            clinic_name,
            address,
            city,
            zip_code,
            country,
            latitude,
            longitude,
            contact_number,
            email,
            logo_url,
            is_verified
          `)
          .eq("is_verified", true);

        if (error) throw error;

        const processedClinics = await Promise.all(
          clinicsData.map(async (clinic) => {
            if (clinic.latitude && clinic.longitude) return clinic;
            
            const geocodedClinic = await geocodeAddress(clinic);
            
            if (geocodedClinic.latitude && geocodedClinic.longitude) {
              const { error: updateError } = await supabase
                .from("veterinary_clinics")
                .update({
                  latitude: geocodedClinic.latitude,
                  longitude: geocodedClinic.longitude
                })
                .eq("id", geocodedClinic.id);
              
              if (updateError) console.error("Error updating clinic coordinates:", updateError);
            }
            
            return geocodedClinic;
          })
        );

        const clinicsWithCoords = processedClinics.filter(
          (clinic) => clinic.latitude && clinic.longitude
        );

        setClinics(clinicsWithCoords);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClinics();
  }, [supabase]);

  const handleBookAppointment = (clinicId) => {
    router.push(`/user/Appointments/${clinicId}`);
  };

  const handleLocateMe = () => {
    setShowPermissionModal(true);
  };

  const confirmLocationAccess = (allow) => {
    setShowPermissionModal(false);
    if (!allow) return;

    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setLocationError(null);
    setShowLocationPopup(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(userPos);
        mapRef.current?.flyTo(userPos, 15);
        setTimeout(() => setShowLocationPopup(false), 5000);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError("Unable to retrieve your location");
        setShowLocationPopup(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative font-[Poppins]">
      {showPermissionModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-4">Location Access</h3>
            <p className="mb-6">Allow this application to access your current location?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => confirmLocationAccess(false)}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Deny
              </button>
              <button
                onClick={() => confirmLocationAccess(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      <MapContainer
        center={BUTUAN_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        ref={mapRef}
        closePopupOnClick={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Clinic Markers */}
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={[clinic.latitude, clinic.longitude]}
            icon={createRedIcon()}
            ref={(ref) => {
              if (ref) {
                markerRefs.current[clinic.id] = ref;
              }
            }}
            eventHandlers={{
              click: () => {
                markerRefs.current[clinic.id]?.openPopup();
              }
            }}
            title={clinic.clinic_name}
          >
            <Popup className="font-[Poppins]">
              <div className="min-w-[250px] p-2">
                {/* Clinic Name */}
                <h3 className="text-lg font-bold text-gray-800 mb-1">
                  {clinic.clinic_name}
                </h3>
                
                {/* Clinic Address */}
                <div className="flex items-start mb-3">
                  <Icon icon="mdi:map-marker" className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-600">
                    {clinic.address}, {clinic.city}, {clinic.country}
                  </p>
                </div>
                
                {/* Contact Information */}
                <div className="flex items-center mb-4">
                  <Icon icon="mdi:phone" className="text-gray-500 mr-2 flex-shrink-0" />
                  <a 
                    href={`tel:${clinic.contact_number}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {clinic.contact_number}
                  </a>
                </div>
                
                {/* Book Appointment Button */}
                <button
                  onClick={() => handleBookAppointment(clinic.id)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  Book Appointment
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <>
            <CircleMarker
              center={userLocation}
              radius={10}
              fillOpacity={0.7}
              stroke={false}
              fillColor="#3388ff"
            />
            <Marker
              position={userLocation}
              icon={L.divIcon({
                html: `
                  <div class="user-location-marker">
                    <div class="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <div class="absolute inset-0 border-2 border-blue-300 rounded-full animate-ping"></div>
                  </div>
                `,
                className: "bg-transparent border-none",
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              })}
            >
              {showLocationPopup && (
                <Popup className="font-[Poppins]">
                  <div className="text-sm font-medium text-blue-600">
                    You are here
                  </div>
                </Popup>
              )}
            </Marker>
          </>
        )}
      </MapContainer>

      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={handleLocateMe}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Locate me"
        >
          <Icon icon="mdi:crosshairs-gps" className="text-gray-700 text-xl" />
        </button>
      </div>

      {locationError && (
        <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-[Poppins]">
          <span className="block sm:inline">{locationError}</span>
        </div>
      )}
    </div>
  );
};

export default VetMap;