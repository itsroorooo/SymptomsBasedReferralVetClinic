// components/GoogleMapsProvider.jsx
"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { createContext, useContext } from "react";

const GoogleMapsContext = createContext(null);

const MAP_CONFIG = {
  id: 'google-map-script',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  libraries: ['places', 'geometry'],
  version: 'weekly',
};

export function GoogleMapsProvider({ children }) {
  const { isLoaded, loadError } = useJsApiLoader(MAP_CONFIG);
  
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
}