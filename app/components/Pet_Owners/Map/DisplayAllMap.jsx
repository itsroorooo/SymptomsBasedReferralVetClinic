"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  GoogleMap, 
  Marker, 
  InfoWindow, 
  useJsApiLoader,
  Circle
} from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";
import BookAppointmentForm from "../Appointments/BookAppointmentForm";

const supabase = createClientComponentClient();

// Error Boundary Component
class MapErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Map Error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-red-50">
          <div className="text-center max-w-md">
            <Icon icon="mdi:map-off" className="text-red-500 text-5xl mb-4 mx-auto" />
            <h3 className="text-xl font-bold text-red-700 mb-2">Map Loading Failed</h3>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || "We couldn't load the map. Please try again."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const LIBRARIES = ['places', 'geometry'];

const AllMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // Default center coordinates (Butuan City)
  const BUTUAN_CENTER = { lat: 8.9475, lng: 125.5406 };
  const DEFAULT_ZOOM = 13;

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES, 
  });

  const handleLocationSuccess = useCallback((position) => {
    if (!position?.coords) return;
    
    // Don't update if the new position is less accurate than current
    if (userLocation && position.coords.accuracy > locationAccuracy) {
      return;
    }
  
    setIsLocating(false);
    const userPos = { 
      lat: position.coords.latitude, 
      lng: position.coords.longitude 
    };
    setUserLocation(userPos);
    setLocationAccuracy(position.coords.accuracy);
    
    // Only show popup for accurate positions (<100m)
    if (position.coords.accuracy < 100) {
      setShowLocationPopup(true);
      setTimeout(() => setShowLocationPopup(false), 5000);
    }
  
    if (mapRef.current) {
      mapRef.current.panTo(userPos);
      // Adjust zoom based on accuracy
      const zoomLevel = position.coords.accuracy < 50 ? 16 : 14;
      mapRef.current.setZoom(zoomLevel);
    }
  }, [userLocation, locationAccuracy]);

  const handleLocationError = useCallback((error) => {
    setIsLocating(false);
    console.error("Full Geolocation error:", error);
    
    let errorMessage = "Unable to retrieve your location";
    if (error?.code) {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location access was denied. Please enable it in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable (your device may not have GPS).";
          break;
        case error.TIMEOUT:
          errorMessage = "The request to get your location timed out. Please try again.";
          break;
        case error.UNKNOWN_ERROR:
          errorMessage = "An unknown error occurred while getting your location.";
          break;
      }
    }
    
    if (error?.message) {
      errorMessage += ` (${error.message})`;
    }
    
    setLocationError(errorMessage);
    setShowLocationPopup(false);
  }, []);

  // Handle map load errors
  useEffect(() => {
    if (loadError) {
      console.error('Google Maps API Error:', loadError);
      setMapLoadError(loadError.message);
    }
  }, [loadError]);

  // Clean up location watcher on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

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

  const startLocationTracking = useCallback(() => {
    setIsLocating(true);
    setLocationError(null);
  
    const handleError = (error) => {
      console.error("Geolocation error:", error);
      setIsLocating(false);
      
      let errorMessage = "Unable to retrieve your location";
      if (error?.code) {
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access was denied. Please enable it in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable (your device may not have GPS).";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get your location timed out. Please try again.";
            break;
          default:
            errorMessage = "An unknown error occurred while getting your location.";
        }
      }
      
      setLocationError(errorMessage);
    };
  
    // First try with high accuracy
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };
  
    // Fallback options if high accuracy fails
    const fallbackOptions = {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 30000
    };
  
    // First attempt with high accuracy
    navigator.geolocation.getCurrentPosition(
      handleLocationSuccess,
      (error) => {
        handleError(error);
        // Try fallback if high accuracy fails
        navigator.geolocation.getCurrentPosition(
          handleLocationSuccess,
          handleError,
          fallbackOptions
        );
      },
      highAccuracyOptions
    );
  
    // Set up watcher
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleError,
      highAccuracyOptions
    );
  }, [handleLocationSuccess]);

  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }
  
    try {
      const permissionStatus = await navigator.permissions?.query({ name: 'geolocation' });
      
      if (permissionStatus) {
        if (permissionStatus.state === 'granted') {
          startLocationTracking();
        } else if (permissionStatus.state === 'prompt') {
          setShowPermissionModal(true);
        } else {
          setLocationError("Please enable location access in your browser settings.");
        }
        
        permissionStatus.onchange = () => {
          if (permissionStatus.state === 'granted') {
            startLocationTracking();
          }
        };
      } else {
        // Fallback for browsers without permissions API
        setShowPermissionModal(true);
      }
    } catch (error) {
      console.error("Permission check error:", error);
      // Fallback to direct request
      startLocationTracking();
    }
  };

  const confirmLocationAccess = (allow) => {
    setShowPermissionModal(false);
    if (!allow) {
      setLocationError("Location access denied. Using default location.");
      return;
    }
    startLocationTracking();
  };

  const getLocationWithFallback = async () => {
    try {
      // First try with high accuracy
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });
      
      // If accuracy is poor (>100m), try again with lower accuracy requirements
      if (pos.coords.accuracy > 100) {
        const fallbackPos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 30000
          });
        });
        return fallbackPos;
      }
      return pos;
    } catch (error) {
      console.error("Geolocation error:", error);
      throw error;
    }
  };

  const handleBookAppointment = (clinic) => {
    setSelectedClinic(clinic);
    setShowAppointmentModal(true);
  };

  const onLoad = (map) => {
    mapRef.current = map;
  };

  const onUnmount = () => {
    mapRef.current = null;
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

  const retryLocation = useCallback(async (attempt = 1) => {
    const maxAttempts = 3;
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
  
    try {
      const position = await getLocationWithFallback();
      setUserLocation(position);
    } catch (error) {
      if (attempt < maxAttempts) {
        setTimeout(() => retryLocation(attempt + 1), delay);
      } else {
        setLocationError("Failed to get accurate location after multiple attempts");
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

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

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p>Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <MapErrorBoundary>
      <div className="h-screen w-full relative font-[Poppins]">
        {showPermissionModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="font-bold text-lg mb-4">Location Access</h3>
              <p className="mb-6">Allow this application to access your current location to show nearby clinics?</p>
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

        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={userLocation || BUTUAN_CENTER}
          zoom={userLocation ? 16 : DEFAULT_ZOOM}
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
          {clinics.map((clinic) => (
            <React.Fragment key={clinic.id}>
              <Marker
                position={{ lat: clinic.latitude, lng: clinic.longitude }}
                onClick={() => setActiveInfoWindow(clinic.id)}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
              />
              {activeInfoWindow === clinic.id && (
                <InfoWindow
                  position={{ lat: clinic.latitude, lng: clinic.longitude }}
                  onCloseClick={() => setActiveInfoWindow(null)}
                >
                  <div className="min-w-[250px] p-2">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">
                      {clinic.clinic_name}
                    </h3>
                    <div className="flex items-start mb-3">
                      <Icon
                        icon="mdi:map-marker"
                        className="text-gray-500 mr-2 mt-0.5 flex-shrink-0"
                      />
                      <p className="text-sm text-gray-600">
                        {clinic.address}, {clinic.city}, {clinic.country}
                      </p>
                    </div>
                    <div className="flex items-center mb-4">
                      <Icon
                        icon="mdi:phone"
                        className="text-gray-500 mr-2 flex-shrink-0"
                      />
                      <a
                        href={`tel:${clinic.contact_number}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {clinic.contact_number}
                      </a>
                    </div>
                    <button
                      onClick={() => handleBookAppointment(clinic)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors"
                    >
                      Book Appointment
                    </button>
                  </div>
                </InfoWindow>
              )}
            </React.Fragment>
          ))}

          {userLocation && (
            <>
              <Marker
                position={userLocation}
                icon={{
                  url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(32, 32),
                }}
              />
              {showLocationPopup && (
                <InfoWindow position={userLocation}>
                  <div className="text-sm font-medium text-blue-600">
                    <p>You are here</p>
                    {locationAccuracy && (
                      <p className="text-xs">Accuracy: ~{Math.round(locationAccuracy)} meters</p>
                    )}
                  </div>
                </InfoWindow>
              )}
              {locationAccuracy && (
                <Circle
                  center={userLocation}
                  radius={locationAccuracy}
                  options={{
                    fillColor: "#4285F4",
                    fillOpacity: locationAccuracy < 100 ? 0.15 : 0.3,
                    strokeColor: "#4285F4",
                    strokeOpacity: 0.8,
                    strokeWeight: locationAccuracy < 100 ? 1 : 2,
                  }}
                />
              )}
            </>
          )}
        </GoogleMap>

        {showAppointmentModal && selectedClinic && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
            <BookAppointmentForm
              clinic={selectedClinic}
              onClose={() => setShowAppointmentModal(false)}
              onSuccess={() => {
                alert("Appointment booked successfully!");
              }}
            />
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-[1000]">
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            className={`p-3 rounded-full shadow-lg transition-colors flex flex-col items-center ${
              isLocating 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-white hover:bg-gray-100"
            }`}
            title={isLocating ? "Locating..." : "Locate me"}
          >
            {isLocating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mb-1"></div>
                <span className="text-xs">Locating...</span>
              </>
            ) : (
              <>
                <Icon icon="mdi:crosshairs-gps" className="text-gray-700 text-xl mb-1" />
                <span className="text-xs">Find Me</span>
              </>
            )}
          </button>
        </div>

        {locationError && (
          <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-[Poppins] max-w-xs animate-fade-in">
            <div className="flex items-start">
              <Icon icon="mdi:alert-circle" className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{locationError}</span>
            </div>
          </div>
        )}
      </div>
    </MapErrorBoundary>
  );
};

export default AllMap;