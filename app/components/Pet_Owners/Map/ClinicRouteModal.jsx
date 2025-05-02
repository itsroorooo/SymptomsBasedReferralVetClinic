"use client";
import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { DirectionsRenderer } from "@react-google-maps/api";

const ClinicRouteModal = ({ 
  isOpen, 
  onClose, 
  clinic, 
  userLocation,
  mapRef
}) => {
  const [directions, setDirections] = useState(null);
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !clinic || !userLocation) return;

    const calculateRoute = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps not loaded");
        }

        const directionsService = new window.google.maps.DirectionsService();
        
        const results = await directionsService.route({
          origin: userLocation,
          destination: { 
            lat: clinic.latitude, 
            lng: clinic.longitude 
          },
          travelMode: window.google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: false
        });

        setDirections(results);
        
        // Set distance and duration
        if (results.routes[0]?.legs[0]) {
          setDistance(results.routes[0].legs[0].distance.text);
          setDuration(results.routes[0].legs[0].duration.text);
        }

        // Pan to show both locations
        if (mapRef.current) {
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend(userLocation);
          bounds.extend({ 
            lat: clinic.latitude, 
            lng: clinic.longitude 
          });
          mapRef.current.fitBounds(bounds, { padding: 100 });
        }
      } catch (err) {
        console.error("Directions error:", err);
        setError("Failed to calculate route. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    calculateRoute();

    return () => {
      setDirections(null);
      setDistance("");
      setDuration("");
    };
  }, [isOpen, clinic, userLocation, mapRef]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000]">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">
            Route to {clinic?.clinic_name}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>

        <div className="p-4">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3">Calculating route...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {directions && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Icon icon="mdi:map-marker-distance" className="text-blue-500 text-xl mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-bold">{distance}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center">
                    <Icon icon="mdi:clock-outline" className="text-blue-500 text-xl mr-2" />
                    <div>
                      <p className="text-xs text-gray-500">Estimated Time</p>
                      <p className="font-bold">{duration}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-64 bg-gray-100 rounded-lg mb-4">
                {/* This will show the route on the map */}
                <DirectionsRenderer 
                  options={{ 
                    directions,
                    suppressMarkers: true,
                    preserveViewport: true
                  }} 
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-sm">Directions:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-sm">
                  {directions.routes[0].legs[0].steps.map((step, index) => (
                    <li 
                      key={index}
                      className="flex items-start"
                      dangerouslySetInnerHTML={{ __html: step.instructions }}
                    />
                  ))}
                </ol>
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClinicRouteModal;