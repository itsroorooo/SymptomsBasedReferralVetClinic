"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Icon } from "@iconify/react";

const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("react-leaflet").then((mod) => mod.Tooltip),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

const ClinicMarker = ({ clinic, onClick, highlight }) => {
  const L = typeof window !== "undefined" ? require("leaflet") : null;

  const icon = L && new L.Icon({
    iconUrl: highlight 
      ? "/map-marker-highlight.png" 
      : "/map-marker.png",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  if (!L || !clinic.latitude || !clinic.longitude) return null;

  // Check if clinic is open now
  const now = new Date();
  const currentDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  const currentTime = now.getHours() * 100 + now.getMinutes();
  
  const schedule = clinic.schedules?.find(s => s.day_of_week === currentDay);
  const isHoliday = clinic.holidays?.some(h => 
    new Date(h.holiday_date).toDateString() === now.toDateString()
  );
  
  const isOpen = schedule && !schedule.is_closed && !isHoliday && 
    currentTime >= schedule.opening_time && 
    currentTime <= schedule.closing_time;

  return (
    <Marker
      position={[clinic.latitude, clinic.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick(clinic.id),
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} permanent={false}>
        <div className="p-1">
          <h3 className="font-bold">{clinic.clinic_name}</h3>
          <p className="text-sm">{clinic.address}</p>
          <p className={`text-xs mt-1 ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
            {isOpen ? 'Open Now' : 'Closed'}
          </p>
        </div>
      </Tooltip>
      
      <Popup>
        <div className="w-48">
          <div className="flex items-start mb-2">
            {clinic.logo_url && (
              <img 
                src={clinic.logo_url} 
                alt={clinic.clinic_name}
                className="w-10 h-10 object-contain mr-2"
              />
            )}
            <div>
              <h3 className="font-bold text-sm">{clinic.clinic_name}</h3>
              <p className="text-xs text-gray-600">{clinic.contact_number}</p>
            </div>
          </div>
          
          <div className="text-xs mb-2">
            <p className="flex items-center">
              <Icon icon="mdi:map-marker" className="mr-1" />
              {clinic.address}, {clinic.city}
            </p>
            {clinic.email && (
              <p className="flex items-center">
                <Icon icon="mdi:email" className="mr-1" />
                {clinic.email}
              </p>
            )}
          </div>

          <div className="text-xs mb-2">
            <p className="font-medium">Available Equipment:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {clinic.clinic_equipment?.slice(0, 3).map(item => (
                <span 
                  key={item.equipment.id} 
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                >
                  {item.equipment.name}
                </span>
              ))}
              {clinic.clinic_equipment?.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{clinic.clinic_equipment.length - 3} more
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onClick(clinic.id)}
            className="w-full bg-blue-600 text-white text-xs py-1 px-2 rounded hover:bg-blue-700 transition mt-2"
          >
            View Clinic Details
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

export default ClinicMarker;