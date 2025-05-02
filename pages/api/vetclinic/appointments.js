// pages/api/vetclinic/appointments.js
import { NextResponse } from 'next/server';
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const clinicId = searchParams.get('clinicId');
  const date = searchParams.get('date');

  console.log('Fetching appointments for:', { clinicId, date }); // Debug log

  if (!clinicId || !date) {
    return NextResponse.json(
      { error: 'clinicId and date parameters are required' },
      { status: 400 }
    );
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        pets (name, pet_type, breed, age),
        pet_owner_profiles (first_name, last_name, contact_number),
        pet_consultations (additional_info),
        veterinary_clinics (clinic_name)
      `)
      .eq('clinic_id', clinicId)
      .eq('appointment_date', date)
      .order('start_time', { ascending: true });

    console.log('Supabase response:', { data, error }); // Debug log

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'No data returned from query' },
        { status: 404 }
      );
    }

    const formattedData = data.map(appointment => ({
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      pet_name: appointment.pets?.name || '',
      pet_type: appointment.pets?.pet_type || '',
      breed: appointment.pets?.breed || '',
      age: appointment.pets?.age || null,
      owner_first_name: appointment.pet_owner_profiles?.[0]?.first_name || '',
      owner_last_name: appointment.pet_owner_profiles?.[0]?.last_name || '',
      owner_phone: appointment.pet_owner_profiles?.[0]?.contact_number || '',
      reason: appointment.pet_consultations?.[0]?.additional_info || '',
      clinic_name: appointment.veterinary_clinics?.clinic_name || ''
    }));

    return NextResponse.json(formattedData);

  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch appointments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}