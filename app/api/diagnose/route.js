import { generatePetDiagnosis } from '@/utils/openai';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { petType, symptoms, additionalInfo, consultationId } = await request.json();
    
    if (!consultationId) {
      throw new Error('Missing consultation ID');
    }

    // Generate AI diagnosis
    const diagnosis = await generatePetDiagnosis(petType, symptoms, additionalInfo);
    
    // Save AI diagnosis to database
    const { data: aiDiagnosis, error: diagnosisError } = await supabase
      .from('ai_diagnoses')
      .insert({
        consultation_id: consultationId,
        possible_condition: diagnosis.possible_condition,
        explanation: diagnosis.explanation
      })
      .select('id') // Fixed: Added quotes around 'id'
      .single();

    if (diagnosisError) throw diagnosisError;

    // Store recommended equipment
    if (diagnosis.recommended_equipment?.length > 0) {
      // Upsert equipment (create if doesn't exist)
      const equipmentUpserts = diagnosis.recommended_equipment.map(name => ({
        name,
        created_at: new Date().toISOString()
      }));

      const { error: upsertError } = await supabase
        .from('equipment')
        .upsert(equipmentUpserts, { onConflict: 'name' });

      if (upsertError) throw upsertError;

      // Get equipment IDs
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment')
        .select('id')
        .in('name', diagnosis.recommended_equipment);

      if (equipmentError) throw equipmentError;

      // Create junction records
      if (equipmentData?.length > 0) {
        const { error: junctionError } = await supabase
          .from('diagnosis_equipment')
          .insert(equipmentData.map(equip => ({
            diagnosis_id: aiDiagnosis.id,
            equipment_id: equip.id
          })));

        if (junctionError) throw junctionError;
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        diagnosis_id: aiDiagnosis.id,
        possible_condition: diagnosis.possible_condition,
        explanation: diagnosis.explanation,
        recommended_equipment: diagnosis.recommended_equipment || []
      } 
    });
  } catch (error) {
    console.error("Diagnosis error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}