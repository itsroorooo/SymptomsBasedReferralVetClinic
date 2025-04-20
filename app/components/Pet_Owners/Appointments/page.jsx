"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [pets, setPets] = useState([]); // State for storing pets
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchAppointmentsAndPets = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        // Fetch appointments with related data
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointments")
          .select(`
            *,
            clinic: veterinary_clinics(
              clinic_name,
              address,
              city,
              logo_url,
              contact_number
            ),
            pet: pets(
              name,
              pet_type,
              photo_url
            ),
            consultation: pet_consultations(
              additional_info
            )
          `)
          .eq("owner_id", user.id)
          .order("appointment_date", { ascending: true })
          .order("start_time", { ascending: true });

        if (appointmentsError) throw appointmentsError;

        setAppointments(appointmentsData || []);

        // Fetch pets owned by the user (similar to Pet/page.jsx)
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", user.id)
          .order("created_at", { ascending: false });

        if (petsError) throw petsError;

        setPets(petsData || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentsAndPets();
  }, [supabase]);

  const filteredAppointments = appointments.filter((appt) => {
    const now = dayjs();
    const appointmentDate = dayjs(`${appt.appointment_date}T${appt.start_time}`);

    switch (filter) {
      case "upcoming":
        return appointmentDate.isAfter(now) && appt.status !== "cancelled";
      case "past":
        return appointmentDate.isBefore(now) || appt.status === "completed";
      case "cancelled":
        return appt.status === "cancelled";
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
        <button
          onClick={() => router.push("/Pet_Owners/Dashboard")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 font-[Poppins]">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Pets</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {pets.map((pet) => (
            <div key={pet.id} className="bg-white rounded-lg shadow p-4">
              {pet.photo_url ? (
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-32 object-cover rounded-md mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center rounded-md mb-4">
                  <Icon icon="mdi:paw" className="text-gray-400 text-4xl" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-800">{pet.name}</h3>
              <p className="text-sm text-gray-600 capitalize">{pet.pet_type}</p>
              <p className="text-sm text-gray-600">Breed: {pet.breed || "Unknown"}</p>
              <p className="text-sm text-gray-600">Age: {pet.age || "Unknown"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Appointments</h1>
          <p className="text-gray-600">
            {filteredAppointments.length} {filter === "all" ? "" : filter} appointment(s)
          </p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === "upcoming" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter("past")}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === "past" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter("cancelled")}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === "cancelled" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Icon icon="mdi:calendar-remove" className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">
            No {filter === "all" ? "" : filter} appointments found
          </h3>
          <p className="text-gray-500 mb-4">
            {filter === "upcoming" 
              ? "You don't have any upcoming appointments scheduled."
              : filter === "past"
              ? "Your past appointments will appear here."
              : "Your appointments will appear here once scheduled."}
          </p>
          <button
            onClick={() => router.push("/Pet_Owners/Map")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book New Appointment
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((appointment) => {
            const appointmentDateTime = dayjs(`${appointment.appointment_date}T${appointment.start_time}`);
            const isUpcoming = appointmentDateTime.isAfter(dayjs()) && appointment.status !== "cancelled";
            const isPast = appointmentDateTime.isBefore(dayjs()) || appointment.status === "completed";
            
            return (
              <div
                key={appointment.id}
                className={`bg-white rounded-xl shadow-sm overflow-hidden border-l-4 ${
                  appointment.status === "cancelled" ? 'border-red-500' :
                  isPast ? 'border-gray-400' :
                  'border-blue-500'
                }`}
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Clinic Info */}
                    <div className="flex items-center flex-1 min-w-0">
                      {appointment.clinic?.logo_url && (
                        <img
                          src={appointment.clinic.logo_url}
                          alt={appointment.clinic.clinic_name}
                          className="w-12 h-12 object-contain rounded-lg mr-4"
                        />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-800 truncate">
                          {appointment.clinic?.clinic_name || "Unknown Clinic"}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {appointment.clinic?.address}, {appointment.clinic?.city}
                        </p>
                      </div>
                    </div>

                    {/* Appointment Date/Time */}
                    <div className="text-center md:text-right">
                      <div className="text-sm font-medium text-gray-700">
                        {dayjs(appointment.appointment_date).format("MMM D, YYYY")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {appointment.start_time} - {appointment.end_time}
                      </div>
                      {isUpcoming && (
                        <div className="text-xs text-gray-400 mt-1">
                          {appointmentDateTime.fromNow()}
                        </div>
                      )}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex flex-col items-end space-y-2">
                      {getStatusBadge(appointment.status)}
                      
                      <div className="flex space-x-2">
                        {isUpcoming && appointment.status !== "cancelled" && (
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-xs text-red-600 hover:text-red-800 flex items-center"
                          >
                            <Icon icon="mdi:cancel" className="mr-1" />
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => router.push(`/Pet_Owners/Appointments/${appointment.id}`)}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                        >
                          <Icon icon="mdi:information-outline" className="mr-1" />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pet & Reason */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center">
                      {appointment.pet?.photo_url ? (
                        <img
                          src={appointment.pet.photo_url}
                          alt={appointment.pet.name}
                          className="w-10 h-10 object-cover rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                          <Icon icon="mdi:paw" className="text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium text-gray-700">{appointment.pet?.name || "Unknown Pet"}</h4>
                        <p className="text-xs text-gray-500 capitalize">
                          {appointment.pet?.pet_type || "Unknown type"}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        <span className="font-medium">Reason:</span>{" "}
                        {appointment.consultation?.additional_info || "No reason provided"}
                      </p>
                    </div>

                    {appointment.clinic?.contact_number && (
                      <a
                        href={`tel:${appointment.clinic.contact_number}`}
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800 whitespace-nowrap"
                      >
                        <Icon icon="mdi:phone" className="mr-1" />
                        Call Clinic
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}