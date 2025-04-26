"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import VetMap from "../Map/page";

const FilteredMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFilteredClinics = async () => {
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
  
        if (recommendedEquipment.length === 0) {
          setClinics([]);
          return;
        }
  
        // 1. Fetch all verified clinics
        const { data: allClinics, error: clinicsError } = await supabase
          .from("veterinary_clinics")
          .select("*")
          .eq("is_verified", true);
  
        if (clinicsError) throw clinicsError;
  
        // 2. Fetch equipment for these clinics
        const clinicIds = allClinics.map((clinic) => clinic.id);
        const { data: clinicEquipment, error: equipmentError } = await supabase
          .from("clinic_equipment")
          .select("clinic_id, equipment(name, id), is_available")
          .in("clinic_id", clinicIds)
          .eq("is_available", true);
  
        if (equipmentError) throw equipmentError;
  
        // 3. Group equipment by clinic (more efficient grouping)
        const clinicsWithEquipment = allClinics.map((clinic) => {
          const equipment = clinicEquipment
            .filter((ce) => ce.clinic_id === clinic.id)
            .map((ce) => ({
              name: ce.equipment?.name,
              id: ce.equipment?.id,
              originalName: ce.equipment?.name // Keep original name for matching
            }))
            .filter(eq => eq.name);
          return { ...clinic, equipment };
        });
  
        // 4. Prepare data for API matching
        const dbEquipments = clinicsWithEquipment.flatMap((c) =>
          c.equipment.map((eq) => ({
            name: eq.name,
            originalName: eq.originalName, // Include original name
            clinicId: c.id,
            equipmentId: eq.id,
            clinicName: c.clinic_name // For debugging
          }))
        );
  
        // 5. Call matching API
        const response = await fetch("/api/match-equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiEquipmentNames: recommendedEquipment,
            dbEquipments: clinicsWithEquipment.flatMap((c) =>
              c.equipment.map((eq) => ({
                name: eq.name,
                clinicId: c.id,
                equipmentId: eq.id,
                clinicName: c.clinic_name
              }))
            ),
          }),
        });
  
        // Process the API response
        const equipmentMatches = await response.json();
        
        // Create a map of clinic IDs to their matched equipment
        const clinicEquipmentMatches = {};
        
        equipmentMatches.forEach(aiMatch => {
          aiMatch.matches?.forEach(match => {
            const clinicId = match.clinicId;
            if (!clinicEquipmentMatches[clinicId]) {
              clinicEquipmentMatches[clinicId] = {
                matchedEquipment: new Set(),
                aiEquipmentMatched: new Set()
              };
            }
            clinicEquipmentMatches[clinicId].matchedEquipment.add(match.name);
            clinicEquipmentMatches[clinicId].aiEquipmentMatched.add(aiMatch.aiName);
          });
        });
  
        // Create the final clinics array with match data
        const matchedClinics = allClinics
          .filter(clinic => clinicEquipmentMatches[clinic.id])
          .map(clinic => {
            const matchData = clinicEquipmentMatches[clinic.id];
            const matchedCount = matchData.aiEquipmentMatched.size;
            const percentage = Math.round(
              (matchedCount / recommendedEquipment.length) * 100
            );
  
            return {
              ...clinic,
              equipmentMatchCount: matchedCount,
              equipmentMatchPercentage: percentage,
              matchedEquipment: Array.from(matchData.matchedEquipment),
              isFullyEquipped: percentage === 100
            };
          })
          .sort((a, b) => b.equipmentMatchPercentage - a.equipmentMatchPercentage);
  
        setClinics(matchedClinics);
        
      } catch (error) {
        console.error("Error fetching clinics:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchFilteredClinics();
  }, [searchParams, supabase]);

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
    <VetMap
      clinics={clinics}
      loading={loading}
      diagnosis={searchParams.get("diagnosis")}
      recommendedEquipment={
        searchParams.get("equipment")
          ? JSON.parse(decodeURIComponent(searchParams.get("equipment")))
          : []
      }
    />
  );
};

export default FilteredMap;