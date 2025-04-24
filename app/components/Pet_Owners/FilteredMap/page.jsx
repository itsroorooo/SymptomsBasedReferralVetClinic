// components/Pet_Owners/FilteredMap/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import VetMap from "../Map/page"; // Reuse your existing map component

const FilteredMap = () => {
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchFilteredClinics = async () => {
      try {
        const equipmentParam = searchParams.get('equipment');
        const recommendedEquipment = equipmentParam ? 
          JSON.parse(decodeURIComponent(equipmentParam)) : [];

        // Get clinics with recommended equipment
        const { data, error } = await supabase
          .from('clinic_equipment')
          .select(`
            clinic_id,
            equipment:equipment_id (name)
          `)
          .in('equipment.name', recommendedEquipment);

        const clinicIds = [...new Set(data.map(item => item.clinic_id))];

        // Get full clinic details
        const { data: clinicsData } = await supabase
          .from('veterinary_clinics')
          .select('*')
          .in('id', clinicIds)
          .eq('is_verified', true);

        setClinics(clinicsData || []);
      } catch (error) {
        console.error("Error fetching clinics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredClinics();
  }, [searchParams, supabase]);

  return (
    <VetMap 
      clinics={clinics} 
      loading={loading}
      isFilteredView={true}
      diagnosis={searchParams.get('diagnosis')}
    />
  );
};

export default FilteredMap;