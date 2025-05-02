"use client";

import { createClient } from "@/utils/supabase/client";

export async function fetchPetPatients() {
  const supabase = createClient();

  try {
    // Step 1: Get current user session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(`Session error: ${sessionError.message}`);
    }
    if (!session) {
      throw new Error("No active session - user not logged in");
    }

    // Step 2: Get user's clinic association
    const { data: clinicUser, error: clinicUserError } = await supabase
      .from("veterinary_clinics")
      .select("id") // Make sure this matches your table structure
      .eq("user_id", session.user.id)
      .single();

    if (clinicUserError) {
      throw new Error(`Clinic user error: ${clinicUserError.message}`);
    }
    if (!clinicUser) {
      throw new Error("User is not associated with any clinic");
    }

    // Use the id field from veterinary_clinics as clinicId
    const clinicId = clinicUser.id; // Changed from clinicUser.clinic_id to clinicUser.id

    // Step 3: Fetch appointments for the clinic
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(
        `
        id,
        consultation_id,
        clinic_id,
        pet_id,
        owner_id,
        appointment_date,
        start_time,
        end_time,
        status,
        reason_for_decline,
        created_at,
        pets (
          id,
          owner_id,
          name,
          pet_type,
          breed,
          age,
          created_at,
          color,
          photo_url,
          weight,
          gender
        )
      `
      )
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: false });

    // ... rest of your function remains the same ...
    if (appointmentsError) {
      throw new Error(
        `Appointments fetch failed: ${appointmentsError.message}`
      );
    }
    if (!appointments || appointments.length === 0) {
      return [];
    }

    // Rest of your existing code...
    const uniqueOwnerIds = [...new Set(appointments.map((a) => a.owner_id))];

    const { data: owners, error: ownersError } = await supabase
      .from("pet_owner_profiles")
      .select("*")
      .in("id", uniqueOwnerIds);

    if (ownersError) {
      throw new Error(`Owners fetch failed: ${ownersError.message}`);
    }

    const ownersById = owners.reduce((acc, owner) => {
      acc[owner.id] = owner;
      return acc;
    }, {});

    const consultationIds = appointments
      .map((a) => a.consultation_id)
      .filter(Boolean);

    let symptomsByConsultationId = {};
    if (consultationIds.length > 0) {
      const { data: consultationSymptoms, error: symptomsError } =
        await supabase
          .from("consultation_symptoms")
          .select(
            `
          consultation_id,
          symptom_id,
          symptoms: symptom_id (id, name, description)
        `
          )
          .in("consultation_id", consultationIds);

      if (symptomsError) {
        throw new Error(`Symptoms fetch failed: ${symptomsError.message}`);
      }

      symptomsByConsultationId = consultationSymptoms.reduce((acc, cs) => {
        if (!acc[cs.consultation_id]) {
          acc[cs.consultation_id] = [];
        }
        acc[cs.consultation_id].push(cs.symptoms);
        return acc;
      }, {});
    }

    const appointmentsByPetId = appointments.reduce((acc, appointment) => {
      if (!acc[appointment.pet_id]) {
        acc[appointment.pet_id] = [];
      }
      acc[appointment.pet_id].push({
        ...appointment,
        symptoms: symptomsByConsultationId[appointment.consultation_id] || [],
      });
      return acc;
    }, {});

    const uniquePets = appointments
      .filter(
        (appointment, index, self) =>
          index === self.findIndex((a) => a.pet_id === appointment.pet_id)
      )
      .map((appointment) => ({
        ...appointment.pets,
        owner: ownersById[appointment.owner_id],
      }));

    return uniquePets.map((pet) => ({
      ...pet,
      appointments: appointmentsByPetId[pet.id] || [],
    }));
  } catch (error) {
    console.error("Error fetching pet patients:", error);
    throw error;
  }
}
