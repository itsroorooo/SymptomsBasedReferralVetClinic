"use client";

import { createClient } from "@/utils/supabase/client";

// Helper function to decode URL-encoded strings
export const decodeDiagnosis = (diagnosis) => {
  if (typeof diagnosis === "string") {
    return decodeURIComponent(diagnosis);
  }
  if (diagnosis?.diagnosis) {
    return decodeURIComponent(diagnosis.diagnosis);
  }
  return "Unknown diagnosis";
};

export const fetchUserAndData = async (
  supabase,
  setUser,
  setLoading,
  setError,
  fetchAppointments
) => {
  try {
    setLoading((prev) => ({ ...prev, page: true, appointments: true }));
    setError(null);

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError) throw userError;

    setUser(user);
    if (!user) {
      setLoading({ page: false, appointments: false });
      return;
    }

    // Check if user is associated with a clinic
    const { data: clinicData, error: clinicError } = await supabase
      .from("users")
      .select("clinic_id")
      .eq("id", user.id)
      .single();

    if (clinicError) throw clinicError;
    if (!clinicData || !clinicData.clinic_id) {
      throw new Error("User is not associated with any clinic");
    }

    await fetchAppointments(clinicData.clinic_id);
  } catch (err) {
    console.error("Error:", err);
    setError(err.message || "Failed to load data");
  } finally {
    setLoading((prev) => ({ ...prev, page: false }));
  }
};

export const fetchAppointments = async (
  supabase,
  clinicId,
  setAppointments,
  setLoading,
  setError
) => {
  try {
    setLoading((prev) => ({ ...prev, appointments: true }));

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_date,
        start_time,
        end_time,
        status,
        reason_for_decline,
        created_at,
        is_ai_booking,
        pet:pet_id (
          id,
          name,
          pet_type,
          breed,
          age,
          photo_url
        ),
        owner:owner_id (
          id,
          email,
          pet_owner_profile:pet_owner_profiles (
            first_name,
            last_name,
            contact_number
          )
        ),
        consultation:consultation_id (
          id,
          additional_info,
          status,
          consultation_symptoms (
            symptom:symptom_id (
              id,
              name
            )
          ),
          ai_diagnoses (
            id,
            possible_condition,
            explanation,
            created_at
          )
        )
      `
      )
      .eq("clinic_id", clinicId)
      .order("appointment_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) throw error;

    // Process data to decode URL-encoded strings
    const processedData = data?.map((appointment) => {
      if (appointment.consultation?.ai_diagnoses) {
        return {
          ...appointment,
          consultation: {
            ...appointment.consultation,
            ai_diagnoses: appointment.consultation.ai_diagnoses.map(
              (diagnosis) => ({
                ...diagnosis,
                possible_condition: decodeDiagnosis(
                  diagnosis.possible_condition
                ),
                explanation: diagnosis.explanation
                  ? decodeDiagnosis(diagnosis.explanation)
                  : null,
              })
            ),
          },
        };
      }
      return appointment;
    });

    setAppointments(processedData || []);
  } catch (err) {
    console.error("Error fetching appointments:", {
      message: err.message,
      details: err.details,
      code: err.code,
    });
    setError("Failed to load appointments");
  } finally {
    setLoading((prev) => ({ ...prev, appointments: false }));
  }
};

export const handleUpdateAppointmentStatus = async (
  supabase,
  appointmentId,
  status,
  reason,
  appointments,
  user,
  setSnackbar,
  setIsProcessing,
  setDeclineDialogOpen,
  setDeclineReason,
  fetchAppointments
) => {
  try {
    setIsProcessing(true);
    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...(status === "declined" && {
        reason_for_decline: reason || "Declined by clinic",
      }),
    };

    const { error } = await supabase
      .from("appointments")
      .update(updateData)
      .eq("id", appointmentId);

    if (error) throw error;

    // Create notification for pet owner
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (appointment?.owner?.id) {
      await supabase.from("notifications").insert({
        user_id: appointment.owner.id,
        title: `Appointment ${status}`,
        message: `Your appointment for ${
          appointment.pet?.name || "your pet"
        } on ${formatDate(appointment.appointment_date)} has been ${status}. ${
          reason ? `Reason: ${reason}` : ""
        }`,
        related_entity_type: "appointment",
        related_entity_id: appointmentId,
      });
    }

    // Refresh appointments
    await fetchAppointments(user.clinic_id);
    setSnackbar({
      open: true,
      message: `Appointment ${status} successfully`,
      severity: "success",
    });
  } catch (err) {
    console.error("Error updating appointment:", {
      message: err.message,
      details: err.details,
      code: err.code,
    });
    setSnackbar({
      open: true,
      message: `Failed to update appointment: ${err.message}`,
      severity: "error",
    });
  } finally {
    setIsProcessing(false);
    if (setDeclineDialogOpen) setDeclineDialogOpen(false);
    if (setDeclineReason) setDeclineReason("");
  }
};

export const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

export const formatTime = (timeString) => {
  return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getStatusColor = (status) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "declined":
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};