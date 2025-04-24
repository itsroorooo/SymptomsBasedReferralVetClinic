"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";

const AllMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [showLocationPopup, setShowLocationPopup] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [activeInfoWindow, setActiveInfoWindow] = useState(null);
  const [mapLoadError, setMapLoadError] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Fetch user's pets when modal opens
  useEffect(() => {
    if (showAppointmentModal) {
      const fetchPets = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: petsData } = await supabase
            .from("pets", pets.id)
            .select("*")
            .eq("owner_id", user.id);
          setPets(petsData || []);
        }
      };
      fetchPets();
    }
  }, [showAppointmentModal, supabase]);

  // Fetch available times when date changes
  useEffect(() => {
    if (appointmentDate && selectedClinic) {
      const fetchAvailableTimes = async () => {
        // Get clinic's working hours for the selected day
        const dayOfWeek = new Date(appointmentDate).getDay();
        const { data: schedule } = await supabase
          .from("veterinary_schedules")
          .select("*")
          .eq("clinic_id", selectedClinic.id)
          .eq("day_of_week", dayOfWeek)
          .single();

        if (schedule && !schedule.is_closed) {
          // Generate time slots (every 30 minutes)
          const times = [];
          let currentTime = new Date(`1970-01-01T${schedule.opening_time}`);
          const endTime = new Date(`1970-01-01T${schedule.closing_time}`);

          while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().substring(0, 5);
            times.push(timeString);
            currentTime = new Date(currentTime.getTime() + 30 * 60000);
          }
          setAvailableTimes(times);
        } else {
          setAvailableTimes([]);
        }
      };
      fetchAvailableTimes();
    }
  }, [appointmentDate, selectedClinic, supabase]);

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
    setSelectedClinic(clinic);
    setShowAppointmentModal(true);
  };

  const handleSubmitAppointment = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");
      if (!selectedPet) throw new Error("Please select a pet");

      // Create consultation first
      const { data: consultation, error: consultError } = await supabase
        .from("pet_consultations")
        .insert({
          pet_id: selectedPet,
          owner_id: user.id,
          additional_info: additionalInfo
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // Add symptoms to consultation
      const symptomInserts = selectedSymptoms.map(symptomId => ({
        consultation_id: consultation.id,
        symptom_id: symptomId
      }));

      if (customSymptom) {
        symptomInserts.push({
          consultation_id: consultation.id,
          custom_symptom: customSymptom
        });
      }

      if (symptomInserts.length > 0) {
        const { error: symptomError } = await supabase
          .from("consultation_symptoms")
          .insert(symptomInserts);
        
        if (symptomError) throw symptomError;
      }

      // Create the appointment
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          consultation_id: consultation.id,
          clinic_id: selectedClinic.id,
          pet_id: selectedPet,
          owner_id: user.id,
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          end_time: calculateEndTime(appointmentTime),
          status: "pending"
        });

      if (appointmentError) throw appointmentError;

      // Success! Close modal and show confirmation
      setShowAppointmentModal(false);
      alert("Appointment booked successfully!");

    } catch (error) {
      console.error("Error booking appointment:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndTime = (startTime) => {
    // Default to 30 minute appointments
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date(1970, 0, 1, hours, minutes + 30);
    return endTime.toTimeString().substring(0, 5);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
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
        {/* Clinics Markers */}
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
                <div className="text-sm font-medium text-blue-600">
                  You are here
                </div>
              </InfoWindow>
            )}
          </Marker>
        )}
      </GoogleMap>

      {/* Locate Me Button */}
      {/* Appointment Booking Modal */}
      {showAppointmentModal && selectedClinic && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000] p-4">
          <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md animate-pop-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-5 text-white relative">
              <button 
                onClick={() => setShowAppointmentModal(false)}
                className="absolute top-3 right-3 text-white hover:text-gray-200"
              >
                <Icon icon="mdi:close" className="text-xl" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 p-2 rounded-full">
                  <Icon icon="mdi:paw" className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Book Appointment</h3>
                  <p className="text-sm opacity-90">{selectedClinic.clinic_name}</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {/* Pet Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Icon icon="mdi:paw-outline" className="mr-2" />
                  Select Pet
                </label>
                {pets.length > 0 ? (
                  <select
                    value={selectedPet}
                    onChange={(e) => setSelectedPet(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  >
                    <option value="">Choose your pet</option>
                    {pets.map(pet => (
                      <option key={pet.id} value={pet.id}>
                        {pet.name} ({pet.pet_type})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No pets registered</p>
                    <button 
                      onClick={() => router.push("/user/pets/new")}
                      className="mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
                    >
                      Add a pet first
                    </button>
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Icon icon="mdi:calendar" className="mr-2" />
                  Appointment Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                />
              </div>

              {/* Time Slot Selection */}
              {appointmentDate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Icon icon="mdi:clock-outline" className="mr-2" />
                    Available Times
                  </label>
                  {availableTimes.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          onClick={() => setAppointmentTime(time)}
                          className={`p-2 rounded-lg border ${
                            appointmentTime === time
                              ? 'bg-pink-500 text-white border-pink-500'
                              : 'bg-white border-gray-300 hover:bg-pink-50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 bg-yellow-50 rounded-lg text-yellow-700">
                      <p>No available times for this date</p>
                    </div>
                  )}
                </div>
              )}

              {/* Symptoms Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Icon icon="mdi:heart-pulse" className="mr-2" />
                  Symptoms
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedSymptoms.map(symptomId => {
                    const symptom = symptoms.find(s => s.id === symptomId);
                    return (
                      <span 
                        key={symptomId}
                        className="inline-flex items-center bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                      >
                        {symptom?.name || "Unknown"}
                        <button 
                          onClick={() => setSelectedSymptoms(prev => prev.filter(id => id !== symptomId))}
                          className="ml-2 text-pink-600 hover:text-pink-800"
                        >
                          <Icon icon="mdi:close" className="text-xs" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    value={customSymptom}
                    onChange={(e) => setCustomSymptom(e.target.value)}
                    placeholder="Add custom symptom"
                    className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-1 focus:ring-pink-300"
                  />
                  <button
                    onClick={() => {
                      if (customSymptom.trim()) {
                        setSelectedSymptoms(prev => [...prev, customSymptom]);
                        setCustomSymptom("");
                      }
                    }}
                    className="bg-pink-500 text-white px-3 rounded-r-lg hover:bg-pink-600"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Additional Info */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <Icon icon="mdi:note-text-outline" className="mr-2" />
                  Additional Information
                </label>
                <textarea
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                  placeholder="Any other details about your pet's condition"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
                  rows={3}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-4 flex justify-end">
              <button
                onClick={() => setShowAppointmentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitAppointment}
                disabled={!selectedPet || !appointmentDate || !appointmentTime || isSubmitting}
                className={`px-4 py-2 rounded-lg flex items-center ${
                  (!selectedPet || !appointmentDate || !appointmentTime || isSubmitting)
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Icon icon="mdi:loading" className="animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  <>
                    <Icon icon="mdi:calendar-check" className="mr-2" />
                    Confirm Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
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
      {/* Location Error Message */}
      {locationError && (
        <div className="absolute bottom-20 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded font-[Poppins]">
          <span className="block sm:inline">{locationError}</span>
        </div>
      )}
    </div>
  );
};

export default AllMap;