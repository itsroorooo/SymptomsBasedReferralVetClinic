"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Icon } from "@iconify/react";

const BookAppointmentForm = ({ 
  clinic, 
  onClose, 
  onSuccess 
}) => {
  const [pets, setPets] = useState([]);
  const [selectedPet, setSelectedPet] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const supabase = createClientComponentClient();

  // Fetch user's pets when component mounts
  useEffect(() => {
    const fetchPets = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: petsData } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", user.id);
        setPets(petsData || []);
      }
    };
    fetchPets();
  }, [supabase]);

  // Fetch symptoms from database
  useEffect(() => {
    const fetchSymptoms = async () => {
      const { data: symptomsData } = await supabase
        .from("symptoms")
        .select("*");
      setSymptoms(symptomsData || []);
    };
    fetchSymptoms();
  }, [supabase]);

  // Fetch available times when date changes
  useEffect(() => {
    if (appointmentDate && clinic) {
      const fetchAvailableTimes = async () => {
        // Get clinic's working hours for the selected day
        const dayOfWeek = new Date(appointmentDate).getDay();
        const { data: schedule } = await supabase
          .from("veterinary_schedules")
          .select("*")
          .eq("clinic_id", clinic.id)
          .eq("day_of_week", dayOfWeek)
          .single();

        if (schedule && !schedule.is_closed) {
          // Generate time slots (every 30 minutes)
          const times = [];
          let currentTime = new Date(`1970-01-01T${schedule.opening_time}`);
          const endTime = new Date(`1970-01-01T${schedule.closing_time}`);

          while (currentTime < endTime) {
            const timeString = currentTime.toTimeString().substring(0, 5);
            times.push(timeString);
            currentTime = new Date(currentTime.getTime() + 30 * 60000);
          }
          setAvailableTimes(times);
        } else {
          setAvailableTimes([]);
        }
      };
      fetchAvailableTimes();
    }
  }, [appointmentDate, clinic, supabase]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");
      if (!selectedPet) throw new Error("Please select a pet");

      // Create consultation first
      const { data: consultation, error: consultError } = await supabase
        .from("pet_consultations")
        .insert({
          pet_id: selectedPet,
          owner_id: user.id,
          additional_info: additionalInfo
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // Add symptoms to consultation
      const symptomInserts = selectedSymptoms.map(symptomId => ({
        consultation_id: consultation.id,
        symptom_id: symptomId
      }));

      if (customSymptom) {
        symptomInserts.push({
          consultation_id: consultation.id,
          custom_symptom: customSymptom
        });
      }

      if (symptomInserts.length > 0) {
        const { error: symptomError } = await supabase
          .from("consultation_symptoms")
          .insert(symptomInserts);
        
        if (symptomError) throw symptomError;
      }

      // Create the appointment
      const { error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          consultation_id: consultation.id,
          clinic_id: clinic.id,
          pet_id: selectedPet,
          owner_id: user.id,
          appointment_date: appointmentDate,
          start_time: appointmentTime,
          end_time: calculateEndTime(appointmentTime),
          status: "pending"
        });

      if (appointmentError) throw appointmentError;

      // Success! Close modal and show confirmation
      onSuccess();
      onClose();

    } catch (error) {
      console.error("Error booking appointment:", error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateEndTime = (startTime) => {
    // Default to 30 minute appointments
    const [hours, minutes] = startTime.split(":").map(Number);
    const endTime = new Date(1970, 0, 1, hours, minutes + 30);
    return endTime.toTimeString().substring(0, 5);
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md animate-pop-in">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-pink-400 to-purple-500 p-5 text-white relative">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-gray-200"
        >
          <Icon icon="mdi:close" className="text-xl" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Icon icon="mdi:paw" className="text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Book Appointment</h3>
            <p className="text-sm opacity-90">{clinic.clinic_name}</p>
          </div>
        </div>
      </div>

      {/* Modal Content */}
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {/* Pet Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:paw-outline" className="mr-2" />
            Select Pet
          </label>
          {pets.length > 0 ? (
            <select
              value={selectedPet}
              onChange={(e) => setSelectedPet(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
            >
              <option value="">Choose your pet</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.pet_type})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pets registered</p>
              <button 
                onClick={() => router.push("/user/pets/new")}
                className="mt-2 text-pink-500 hover:text-pink-600 text-sm font-medium"
              >
                Add a pet first
              </button>
            </div>
          )}
        </div>

        {/* Date Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:calendar" className="mr-2" />
            Appointment Date
          </label>
          <input
            type="date"
            min={new Date().toISOString().split('T')[0]}
            value={appointmentDate}
            onChange={(e) => setAppointmentDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
          />
        </div>

        {/* Time Slot Selection */}
        {appointmentDate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
              <Icon icon="mdi:clock-outline" className="mr-2" />
              Available Times
            </label>
            {availableTimes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    onClick={() => setAppointmentTime(time)}
                    className={`p-2 rounded-lg border ${
                      appointmentTime === time
                        ? 'bg-pink-500 text-white border-pink-500'
                        : 'bg-white border-gray-300 hover:bg-pink-50'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 bg-yellow-50 rounded-lg text-yellow-700">
                <p>No available times for this date</p>
              </div>
            )}
          </div>
        )}

        {/* Symptoms Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:heart-pulse" className="mr-2" />
            Symptoms
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedSymptoms.map(symptomId => {
              const symptom = symptoms.find(s => s.id === symptomId);
              return (
                <span 
                  key={symptomId}
                  className="inline-flex items-center bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                >
                  {symptom?.name || "Unknown"}
                  <button 
                    onClick={() => setSelectedSymptoms(prev => prev.filter(id => id !== symptomId))}
                    className="ml-2 text-pink-600 hover:text-pink-800"
                  >
                    <Icon icon="mdi:close" className="text-xs" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="flex">
            <input
              type="text"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              placeholder="Add custom symptom"
              className="flex-1 p-2 border border-gray-300 rounded-l-lg focus:ring-1 focus:ring-pink-300"
            />
            <button
              onClick={() => {
                if (customSymptom.trim()) {
                  setSelectedSymptoms(prev => [...prev, customSymptom]);
                  setCustomSymptom("");
                }
              }}
              className="bg-pink-500 text-white px-3 rounded-r-lg hover:bg-pink-600"
            >
              Add
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:note-text-outline" className="mr-2" />
            Additional Information
          </label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder="Any other details about your pet's condition"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-300 focus:border-pink-400"
            rows={3}
          />
        </div>
      </div>

      {/* Modal Footer */}
      <div className="bg-gray-50 px-5 py-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 rounded-lg mr-2 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedPet || !appointmentDate || !appointmentTime || isSubmitting}
          className={`px-4 py-2 rounded-lg flex items-center ${
            (!selectedPet || !appointmentDate || !appointmentTime || isSubmitting)
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
        >
          {isSubmitting ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin mr-2" />
              Booking...
            </>
          ) : (
            <>
              <Icon icon="mdi:calendar-check" className="mr-2" />
              Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BookAppointmentForm;