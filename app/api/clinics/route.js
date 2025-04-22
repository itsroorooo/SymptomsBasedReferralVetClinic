import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = createClient();
  
  try {
    const { equipmentNeeded } = await request.json();
    
    if (!equipmentNeeded || !Array.isArray(equipmentNeeded) || equipmentNeeded.length === 0) {
      throw new Error('No equipment specified');
    }

    // Fetch clinics that have the recommended equipment
    const { data: clinics, error } = await supabase
      .from('veterinary_clinics')
      .select(`
        id,
        clinic_name,
        address,
        city,
        province,
        contact_number,
        equipment:clinic_equipment!inner(
          equipment:equipment(name)
        )
      `)
      .in('equipment.equipment.name', equipmentNeeded)
      .eq('is_verified', true);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      data: clinics || []
    });
  } catch (error) {
    console.error("Clinics error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}