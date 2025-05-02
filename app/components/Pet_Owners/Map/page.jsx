"use client";
import React, { useState, useEffect, useRef } from "react";
import { 
  GoogleMap, 
  Marker, 
  InfoWindow, 
  useJsApiLoader, 
  Circle, 
  DirectionsRenderer 
} from "@react-google-maps/api";
import { Icon } from "@iconify/react";
import { Hospital, MapPin, Crosshair, ChevronRight } from "lucide-react";
import BookingModal from "../Appointments/BookingModal";
import PropTypes from 'prop-types';

const VetMap = ({
  clinics = [],
  loading,
  diagnosis,
  recommendedEquipment = [],
  onLocateMe,
  userLocation,
  radius,
  onRadiusChange,
  directions,
  selectedClinicForDirections,
  clearDirections,
  showDirections
}) => {
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);

  const MAP_CONFIG = {
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  };
  
  const { isLoaded, loadError } = useJsApiLoader(MAP_CONFIG);

  const BUTUAN_CENTER = { lat: 8.9475, lng: 125.5406 };
  const DEFAULT_ZOOM = 13;

  const onLoad = (map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();
  };

  const onUnmount = () => {
    mapRef.current = null;
  };

  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  const handleBookAppointment = (clinic) => {
    setSelectedClinic({
      ...clinic,
      diagnosisData: {
        possible_condition: diagnosis,
        recommended_equipment: recommendedEquipment
      }
    });
  };

  const confirmLocationAccess = (allow) => {
    setShowPermissionModal(false);
    if (!allow) return;

    setLocationError(null);
    setLocationInfo("Locating...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userPos = { 
          lat: pos.coords.latitude, 
          lng: pos.coords.longitude 
        };
        if (onLocateMe) onLocateMe();
        
        try {
          if (geocoderRef.current) {
            const results = await geocoderRef.current.geocode({ location: userPos });
            if (results[0]) {
              setLocationInfo(results[0].formatted_address);
            }
          }
        } catch (geocodeError) {
          console.log("Geocoding failed:", geocodeError);
          setLocationInfo("Your current location");
        }
        
        setTimeout(() => setLocationInfo(null), 5000);
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocationError(getLocationError(err));
        setLocationInfo(null);
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  const getLocationError = (error) => {
    switch(error.code) {
      case error.PERMISSION_DENIED:
        return "Location access was denied. Please enable it in your browser settings.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "The request to get your location timed out.";
      default:
        return "Unable to retrieve your location.";
    }
  };

  const handleLocateUser = () => {
    if (onLocateMe) {
      onLocateMe();
    } else {
      if (!navigator.geolocation) {
        setLocationError("Geolocation is not supported by your browser");
        return;
      }
      setShowPermissionModal(true);
    }
  };

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <Icon icon="mdi:alert-circle-outline" className="text-red-500 text-5xl mb-4" />
        <h2 className="text-2xl font-bold mb-2">Map Loading Error</h2>
        <p className="mb-4">We couldn't load Google Maps. Please check:</p>
        <ul className="text-left list-disc pl-5 mb-4 max-w-md mx-auto">
          <li>Your internet connection is working</li>
          <li>The API key is valid and enabled in Google Cloud Console</li>
          <li>Required APIs are enabled</li>
        </ul>
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
      {showPermissionModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-bold text-lg mb-4">Location Access</h3>
            <p className="mb-6">Allow this application to access your current location to find nearby clinics?</p>
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

      <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Hospital className="h-6 w-6 text-blue-500" />
              {recommendedEquipment.length > 0 ? (
                <>
                  Clinics for: {decodeURIComponent(diagnosis)}
                  <span className="block text-sm font-normal text-gray-600 mt-1">
                    Showing {clinics.length} clinics within {radius} km
                  </span>
                </>
              ) : "All Veterinary Clinics"}
            </h1>
            {recommendedEquipment.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-gray-600">
                  Required equipment: 
                  {recommendedEquipment.map((equip, index) => (
                    <span key={index} className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {equip}
                    </span>
                  ))}
                </p>
              </div>
            )}
          </div>
          
          {userLocation && (
            <button 
              onClick={() => setShowRadiusSelector(!showRadiusSelector)}
              className="p-2 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
              title="Change search radius"
            >
              <Icon icon="mdi:map-marker-radius" className="text-blue-600" />
            </button>
          )}
        </div>
        
        {showRadiusSelector && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Radius: {radius} km
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => onRadiusChange(parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={userLocation || BUTUAN_CENTER}
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
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#4285F4",
                strokeOpacity: 0.8,
                strokeWeight: 5
              },
              suppressMarkers: true, // This prevents DirectionsRenderer from adding its own markers
              preserveViewport: true
            }}
          />
        )}

        {/* Render all clinics, including the one we're showing directions to */}
        {clinics.map((clinic) => {
          const markerColor = clinic.isFullyEquipped ? "green" : 
                           clinic.equipmentMatchPercentage >= 50 ? "yellow" : "red";

          // Highlight the clinic we're showing directions to
          const isDestination = selectedClinicForDirections?.id === clinic.id;
          const markerSize = isDestination ? 50 : 40;

          return (
            <Marker
              key={clinic.id}
              position={{ lat: clinic.latitude, lng: clinic.longitude }}
              onClick={() => setActiveInfoWindow(clinic.id)}
              icon={{
                url: `https://maps.google.com/mapfiles/ms/icons/${markerColor}-dot.png`,
                scaledSize: new window.google.maps.Size(markerSize, markerSize),
              }}
              zIndex={isDestination ? 1000 : 1} // Bring destination marker to front
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

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleBookAppointment(clinic)}
                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${
                          clinic.isFullyEquipped
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        Book
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          );
        })}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
              scaledSize: new window.google.maps.Size(32, 32),
            }}
          >
            {locationInfo && (
              <InfoWindow>
                <div className="text-sm font-medium text-blue-600">
                  {locationInfo}
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}
        
        {/* Search radius circle */}
        {userLocation && !directions && (
          <Circle
            center={userLocation}
            radius={radius * 1000}
            options={{
              fillColor: "#4285F4",
              fillOpacity: 0.2,
              strokeColor: "#4285F4",
              strokeOpacity: 0.8,
              strokeWeight: 2,
            }}
          />
        )}
      </GoogleMap>

      {directions && (
        <div className="absolute bottom-20 left-4 z-[1000] bg-white p-3 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm">Showing directions</h4>
            <button
              onClick={clearDirections}
              className="ml-4 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm transition-colors"
            >
              Close
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-600">
            {selectedClinicForDirections?.clinic_name} - {selectedClinicForDirections?.distance?.toFixed(1)} km away
          </div>
        </div>
      )}

      {!directions && (
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
      )}

      {selectedClinic && (
        <BookingModal 
          clinic={selectedClinic}
          onClose={() => setSelectedClinic(null)}
        />
      )}

      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={handleLocateUser}
          className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          title="Locate me"
        >
          <Icon icon="mdi:crosshairs-gps" className="text-gray-700 text-xl" />
        </button>
      </div>

      {locationError && (
        <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-xs">
          {locationError}
        </div>
      )}
    </div>
  );
};

VetMap.propTypes = {
  clinics: PropTypes.array,
  loading: PropTypes.bool,
  diagnosis: PropTypes.string,
  recommendedEquipment: PropTypes.array,
  onLocateMe: PropTypes.func,
  userLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number
  }),
  radius: PropTypes.number,
  onRadiusChange: PropTypes.func,
  directions: PropTypes.object,
  selectedClinicForDirections: PropTypes.object,
  clearDirections: PropTypes.func,
  showDirections: PropTypes.func.isRequired
};

export default VetMap;