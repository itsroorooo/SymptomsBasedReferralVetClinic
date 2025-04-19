"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";

const VetMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const mapRef = useRef(null);

  // Default center coordinates (Butuan City)
  const BUTUAN_CENTER = { lat: 8.9475, lng: 125.5406 };
  const DEFAULT_ZOOM = 13;

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  // Handle map load errors
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API Error:', loadError);
      setMapLoadError(loadError.message);
    }
  }, [loadError]);

  // Fetch clinics from Supabase
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

        setClinics(clinicsData.filter(clinic => clinic.latitude && clinic.longitude));
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
        const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(userPos);
        if (mapRef.current) {
          mapRef.current.panTo(userPos);
          mapRef.current.setZoom(15);
        }
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

  const onLoad = (map) => {
    mapRef.current = map;
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Map load error state
  if (mapLoadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <Icon icon="mdi:alert-circle-outline" className="text-red-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold mb-2">Map Loading Error</h2>
        <p className="mb-4">We couldn't load Google Maps. Please check:</p>
        <ul className="text-left list-disc pl-5 mb-4 max-w-md mx-auto">
          <li>Your internet connection is working</li>
          <li>The API key is valid and enabled in Google Cloud Console</li>
          <li>Required APIs are enabled (Maps JavaScript API, Places API)</li>
          <li>Billing is enabled for your Google Cloud project</li>
        </ul>
        <div className="bg-yellow-100 p-4 rounded-md mb-4 text-sm">
          <p>Debug info: {mapLoadError}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  // Map loading state
  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative font-[Poppins]">
      {/* Location Permission Modal */}
      {showPermissionModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-4">Location Access</h3>
            <p className="mb-6">Allow this application to access your current location?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => confirmLocationAccess(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Deny
              </button>
              <button
                onClick={() => confirmLocationAccess(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Google Map */}
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={BUTUAN_CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {/* Clinic Markers */}
        {clinics.map((clinic) => (
          <Marker
            key={clinic.id}
            position={{ lat: clinic.latitude, lng: clinic.longitude }}
            onClick={() => setActiveInfoWindow(clinic.id)}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
              scaledSize: new window.google.maps.Size(32, 32),
            }}
          >
            {activeInfoWindow === clinic.id && (
              <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                <div className="min-w-[250px] p-2">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {clinic.clinic_name}
                  </h3>
                  <div className="flex items-start mb-3">
                    <Icon icon="mdi:map-marker" className="text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600">
                      {clinic.address}, {clinic.city}, {clinic.country}
                    </p>
                  </div>
                  <div className="flex items-center mb-4">
                    <Icon icon="mdi:phone" className="text-gray-500 mr-2 flex-shrink-0" />
                    <a
                      href={`tel:${clinic.contact_number}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {clinic.contact_number}
                    </a>
                  </div>
                  <button
                    onClick={() => handleBookAppointment(clinic.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                  >
                    Book Appointment
                  </button>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* User Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(32, 32),
            }}
          >
            {showLocationPopup && (
              <InfoWindow>
                <div className="text-sm font-medium text-blue-600">You are here</div>
              </InfoWindow>
            )}
          </Marker>
        )}
      </GoogleMap>

      {/* Locate Me Button */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={handleLocateMe}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          title="Locate me"
        >
          <Icon icon="mdi:crosshairs-gps" className="text-gray-700 text-xl" />
        </button>
      </div>

      {/* Location Error Message */}
      {locationError && (
        <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-[Poppins]">
          <span className="block sm:inline">{locationError}</span>
        </div>
      )}
    </div>
  );
};

export default VetMap;