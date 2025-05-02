"use client";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import VetMap from "../Map/page";
import { Icon } from "@iconify/react";
import { Hospital, MapPin, Crosshair, ChevronRight } from "lucide-react";

const FilteredMap = () => {
  const [clinics, setClinics] = useState([]);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [showNearbyClinics, setShowNearbyClinics] = useState(false);
  const [nearbyClinics, setNearbyClinics] = useState([]);
  const [radius, setRadius] = useState(10);
  const [directions, setDirections] = useState(null);
  const [selectedClinicForDirections, setSelectedClinicForDirections] = useState(null);
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  const calculateDistance = useCallback((lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const filterClinicsByDistance = useCallback((clinics, userLat, userLng, radiusKm) => {
    return clinics.map(clinic => {
      const distance = calculateDistance(
        userLat,
        userLng,
        clinic.latitude,
        clinic.longitude
      );
      return { ...clinic, distance };
    })
    .filter(clinic => clinic.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
  }, [calculateDistance]);

  const showDirections = useCallback((clinic) => {
    if (!userLocation) return;
    
    setSelectedClinicForDirections(clinic);
    
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: userLocation,
        destination: { lat: clinic.latitude, lng: clinic.longitude },
        travelMode: window.google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          console.error(`Directions request failed: ${status}`);
        }
      }
    );
  }, [userLocation]);

  const clearDirections = () => {
    setDirections(null);
    setSelectedClinicForDirections(null);
  };

  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        
        if (clinics.length > 0) {
          const nearby = filterClinicsByDistance(clinics, userPos.lat, userPos.lng, radius);
          setFilteredClinics(nearby);
          setNearbyClinics(nearby.slice(0, 5));
          setShowNearbyClinics(true);
        }
      },
      (err) => {
        setError(getLocationError(err));
      }
    );
  }, [clinics, filterClinicsByDistance, radius]);

  useEffect(() => {
    if (userLocation && clinics.length > 0) {
      const nearby = filterClinicsByDistance(clinics, userLocation.lat, userLocation.lng, radius);
      setFilteredClinics(nearby);
      setNearbyClinics(nearby.slice(0, 5));
    }
  }, [radius, userLocation, clinics, filterClinicsByDistance]);

  const fetchFilteredClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const equipmentParam = searchParams.get("equipment");
      const diagnosisParam = searchParams.get("diagnosis");

      if (!diagnosisParam) {
        throw new Error("Diagnosis parameter is required");
      }

      const recommendedEquipment = equipmentParam
        ? JSON.parse(decodeURIComponent(equipmentParam))
        : [];

      const { data, error } = await supabase
        .from('veterinary_clinics')
        .select(`
          *,
          clinic_equipment!inner(
            equipment:equipment_id(name)
          )
        `)
        .in('clinic_equipment.equipment.name', recommendedEquipment)
        .eq('clinic_equipment.is_available', true);

      if (error) throw error;
      
      const processedClinics = data.map(clinic => {
        const equipmentNames = clinic.clinic_equipment
          .filter(ce => ce.equipment && ce.equipment.name)
          .map(ce => ce.equipment.name);
          
        const matchedEquipment = recommendedEquipment.filter(equip => 
          equipmentNames.includes(equip)
        );
        
        const equipmentMatchCount = matchedEquipment.length;
        const equipmentMatchPercentage = Math.round((equipmentMatchCount / recommendedEquipment.length) * 100);
        const isFullyEquipped = equipmentMatchCount === recommendedEquipment.length;
        
        return {
          ...clinic,
          equipment: equipmentNames,
          matchedEquipment,
          equipmentMatchCount,
          equipmentMatchPercentage,
          isFullyEquipped
        };
      });
      
      setClinics(processedClinics);
      setFilteredClinics(processedClinics);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching clinics:', error);
      setError(error?.message || "Unknown error fetching clinics");
      setLoading(false);
    }
  }, [searchParams, supabase]);

  useEffect(() => {
    fetchFilteredClinics();
  }, [fetchFilteredClinics]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Clinics
        </h2>
        <p className="text-gray-700 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <VetMap
        clinics={filteredClinics}
        loading={loading}
        diagnosis={searchParams.get("diagnosis")}
        recommendedEquipment={
          searchParams.get("equipment")
            ? JSON.parse(decodeURIComponent(searchParams.get("equipment")))
            : []
        }
        onLocateMe={handleLocateMe}
        userLocation={userLocation}
        radius={radius}
        onRadiusChange={setRadius}
        directions={directions}
        selectedClinicForDirections={selectedClinicForDirections}
        clearDirections={clearDirections}
      />

      {/* Nearby Clinics Sidebar Modal */}
      {showNearbyClinics && (
        <div className="absolute top-0 right-0 h-full w-96 bg-white shadow-xl z-[1000] transform transition-transform duration-300 ease-in-out">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-xl font-bold flex items-center">
              <MapPin className="mr-2 text-blue-500" />
              Nearby Clinics
            </h3>
            <button 
              onClick={() => setShowNearbyClinics(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <Icon icon="mdi:close" className="text-gray-500 text-xl" />
            </button>
          </div>

          <div className="p-4">
            <div className="flex items-center mb-4 text-sm text-gray-600">
              <Crosshair className="mr-2 text-blue-500" size={16} />
              Showing clinics near your current location
            </div>

            <div className="space-y-4">
              {nearbyClinics.map((clinic, index) => (
                <div 
                  key={clinic.id} 
                  className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                    clinic.isFullyEquipped 
                      ? 'border-green-200 bg-green-50' 
                      : clinic.equipmentMatchPercentage >= 50 
                        ? 'border-yellow-200 bg-yellow-50' 
                        : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg flex items-center">
                        {index + 1}. {clinic.clinic_name}
                        {clinic.isFullyEquipped && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            Best Match
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{clinic.address}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-blue-600">
                        {clinic.distance.toFixed(1)} km
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Equipment Match:</span>
                      <span className="font-medium">
                        {clinic.equipmentMatchCount}/{clinic.matchedEquipment.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          clinic.isFullyEquipped ? 'bg-green-500' :
                          clinic.equipmentMatchPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${clinic.equipmentMatchPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      className="w-full flex items-center justify-between py-2 px-3 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      onClick={() => showDirections(clinic)}
                    >
                      <span>Show Directions</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



export default FilteredMap;