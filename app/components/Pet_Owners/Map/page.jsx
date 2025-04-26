"use client";
import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Hospital, MapPin } from "lucide-react";
import BookingModal from "../Appointments/BookingModal";

const VetMap = ({ 
  clinics = [], 
  loading = false,
  diagnosis = '',
  recommendedEquipment = []
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const router = useRouter();
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

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API Error:', loadError);
    }
  }, [loadError]);

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

  const handleBookAppointment = (clinic) => {
    const urlParams = new URLSearchParams(window.location.search);
    setSelectedClinic({
      ...clinic,
      diagnosisData: {
        possible_condition: urlParams.get('diagnosis'),
        recommended_equipment: JSON.parse(decodeURIComponent(urlParams.get('equipment') || '[]')),
        symptomIds: JSON.parse(decodeURIComponent(urlParams.get('symptomIds') || '[]'))
      }
    });
  };

  const onLoad = (map) => {
    mapRef.current = map;
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4">Loading clinics...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <Icon icon="mdi:alert-circle-outline" className="text-red-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold mb-2">Map Loading Error</h2>
        <p className="mb-4">We couldn't load Google Maps. Please try again later.</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          Reload Page
        </button>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full relative font-[Poppins]">
      {/* Header */}
      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-md max-w-md">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Hospital className="h-6 w-6 text-blue-500" />
          {diagnosis ? `Clinics for: ${decodeURIComponent(diagnosis)}` : "All Veterinary Clinics"}
        </h1>
        {recommendedEquipment.length > 0 && (
          <div className="mt-2">
            <p className="text-sm text-gray-600 mb-2">Required equipment:</p>
            <div className="flex flex-wrap gap-2">
              {recommendedEquipment.map((equip, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {equip}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

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
        {clinics.map((clinic) => {
          const markerColor = clinic.isFullyEquipped ? "green" : 
                           clinic.equipmentMatchPercentage >= 50 ? "yellow" : "red";

          return (
            <Marker
              key={clinic.id}
              position={{ lat: clinic.latitude, lng: clinic.longitude }}
              onClick={() => setActiveInfoWindow(clinic.id)}
              icon={{
                url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
                scaledSize: new window.google.maps.Size(40, 40),
              }}
            >
              {activeInfoWindow === clinic.id && (
                <InfoWindow onCloseClick={() => setActiveInfoWindow(null)}>
                  <div className="min-w-[300px] p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-1">
                          {clinic.clinic_name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {clinic.address}, {clinic.city}
                        </p>
                      </div>
                      {clinic.isFullyEquipped && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Best Match
                        </span>
                      )}
                    </div>

                    <div className="my-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">Equipment Match:</span>
                        <span className="text-sm font-bold">
                          {clinic.equipmentMatchCount}/{recommendedEquipment.length} (
                          {clinic.equipmentMatchPercentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full ${
                            clinic.isFullyEquipped ? 'bg-green-500' :
                            clinic.equipmentMatchPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${clinic.equipmentMatchPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBookAppointment(clinic)}
                      className={`w-full py-2 px-4 rounded-md text-sm font-medium mt-2 ${
                        clinic.isFullyEquipped
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-blue-600 hover:bg-blue-700 text-white'
                      }`}
                    >
                      {clinic.isFullyEquipped ? '⭐ Book (Recommended)' : 'Book Appointment'}
                    </button>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}

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

      {/* Legend */}
      <div className="absolute bottom-20 left-4 z-[1000] bg-white p-3 rounded-lg shadow-md">
        <h4 className="font-bold text-sm mb-2">Clinic Recommendations</h4>
        <div className="flex items-center mb-1">
          <img 
            src="https://maps.google.com/mapfiles/ms/icons/green-dot.png" 
            alt="Fully equipped" 
            className="w-4 h-4 mr-2"
          />
          <span className="text-xs">Fully equipped (Best match)</span>
        </div>
        <div className="flex items-center mb-1">
          <img 
            src="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png" 
            alt="Partially equipped" 
            className="w-4 h-4 mr-2"
          />
          <span className="text-xs">Partially equipped</span>
        </div>
        <div className="flex items-center">
          <img 
            src="https://maps.google.com/mapfiles/ms/icons/red-dot.png" 
            alt="Minimally equipped" 
            className="w-4 h-4 mr-2"
          />
          <span className="text-xs">Minimally equipped</span>
        </div>
      </div>

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

      {/* Booking Modal */}
      {selectedClinic && (
        <BookingModal 
          clinic={selectedClinic}
          onClose={() => setSelectedClinic(null)}
        />
      )}

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
        <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {locationError}
        </div>
      )}
    </div>
  );
};

export default VetMap;