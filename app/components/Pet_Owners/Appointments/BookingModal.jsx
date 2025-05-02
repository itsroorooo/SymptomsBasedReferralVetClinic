"use client";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Calendar, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingModal = ({ clinic, onClose, initialPetId = "" }) => {
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedPet, setSelectedPet] = useState(initialPetId);
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loadingTimes, setLoadingTimes] = useState(false);

  // Check if a time slot is in the past for the selected date
  const isPastTime = (date, time) => {
    if (!date || !time) return false;
    
    const today = new Date();
    const selectedDate = new Date(date);
    
    // If selected date is not today, it's not a past time
    if (selectedDate.toDateString() !== today.toDateString()) {
      return false;
    }
    
    // Get current hours and minutes
    const currentHours = today.getHours();
    const currentMinutes = today.getMinutes();
    
    // Parse the time slot
    const [hours, minutes] = time.split(':').map(Number);
    
    // Compare with current time
    if (hours < currentHours) return true;
    if (hours === currentHours && minutes < currentMinutes) return true;
    
    return false;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Check if date is a holiday
  const isHoliday = useCallback(
    (date) => {
      return holidays.some(
        (holiday) =>
          new Date(holiday.holiday_date).toDateString() ===
          new Date(date).toDateString()
      );
    },
    [holidays]
  );

  // Calculate end time (30 minutes after start)
  const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endTime = new Date(1970, 0, 1, hours, minutes + 30);
    return endTime.toTimeString().substring(0, 5);
  };

  // Fetch user's pets and clinic holidays
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("User not authenticated");

        // Fetch pets
        const { data: petsData, error: petsError } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", user.id);

        if (petsError) throw petsError;

        setPets(petsData || []);
        
        // Set initial pet if provided, otherwise first pet
        if (initialPetId && petsData?.some(pet => pet.id === initialPetId)) {
          setSelectedPet(initialPetId);
        } else if (petsData?.length > 0) {
          setSelectedPet(petsData[0].id);
        }

        // Fetch holidays
        if (clinic.id) {
          const { data: holidaysData, error: holidaysError } = await supabase
            .from("veterinary_holidays")
            .select("*")
            .eq("clinic_id", clinic.id);

          if (holidaysError) throw holidaysError;

          setHolidays(holidaysData || []);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clinic.id, initialPetId, supabase]);

  // Fetch available appointment times when date changes
  useEffect(() => {
    if (!selectedDate || !clinic.id) return;

    const fetchAvailableTimes = async () => {
      setLoadingTimes(true);
      setAvailableTimes([]);
      setSelectedTime("");

      if (isHoliday(selectedDate)) {
        setLoadingTimes(false);
        return;
      }

      const dayOfWeek = selectedDate.getDay();

      try {
        // Get clinic schedule
        const { data: schedule, error: scheduleError } = await supabase
          .from("veterinary_schedules")
          .select("*")
          .eq("clinic_id", clinic.id)
          .eq("day_of_week", dayOfWeek)
          .single();

        if (scheduleError) throw scheduleError;

        if (!schedule || schedule.is_closed) {
          setLoadingTimes(false);
          return;
        }

        // Format date for query
        const formattedDate = selectedDate.toISOString().split('T')[0];

        // Get existing appointments
        const { data: appointments, error: appointmentsError } = await supabase
          .from("appointments")
          .select("start_time")
          .eq("clinic_id", clinic.id)
          .eq("appointment_date", formattedDate)
          .in("status", ['pending', 'confirmed']);

        if (appointmentsError) throw appointmentsError;

        // Generate available time slots
        const bookedTimes = appointments?.map((a) => a.start_time) || [];
        const times = [];
        const opening = new Date(`1970-01-01T${schedule.opening_time}`);
        const closing = new Date(`1970-01-01T${schedule.closing_time}`);
        let currentTime = new Date(opening);

        while (currentTime < closing) {
          const timeString = currentTime.toTimeString().substring(0, 5);
          if (!bookedTimes.includes(timeString)) {
            times.push(timeString);
          }
          currentTime = new Date(currentTime.getTime() + 30 * 60000);
        }

        setAvailableTimes(times);
        // Auto-select first available time that's not in the past
        const firstValidTime = times.find(time => !isPastTime(selectedDate, time));
        if (firstValidTime) setSelectedTime(firstValidTime);
      } catch (error) {
        console.error('Error fetching available times:', error);
        setError('Failed to load available times');
      } finally {
        setLoadingTimes(false);
      }
    };

    fetchAvailableTimes();
  }, [selectedDate, clinic.id, isHoliday, supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!selectedPet) throw new Error("Please select a pet");
      if (!selectedDate) throw new Error("Please select a date");
      if (!selectedTime) throw new Error("Please select a time");
      if (isPastTime(selectedDate, selectedTime)) throw new Error("Cannot select a time that has already passed");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Get pet details
      const pet = pets.find(p => p.id === selectedPet);
      if (!pet) throw new Error("Selected pet not found");

      // Get parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const diagnosis = urlParams.get('diagnosis');
      const equipment = JSON.parse(decodeURIComponent(urlParams.get('equipment') || '[]'));
      const symptomIds = JSON.parse(decodeURIComponent(urlParams.get('symptomIds') || '[]'));

      // 1. Create consultation record
      const { data: consultation, error: consultError } = await supabase
        .from("pet_consultations")
        .insert({
          pet_id: selectedPet,
          owner_id: user.id,
          additional_info: additionalNotes,
          status: "pending",
          pet_type: pet.pet_type,
          owner_name: user.user_metadata?.full_name || ""
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // 2. Link symptoms if they exist
      if (symptomIds.length > 0) {
        const symptomInserts = symptomIds.map(symptomId => ({
          consultation_id: consultation.id,
          symptom_id: symptomId
        }));

        const { error: symptomError } = await supabase
          .from("consultation_symptoms")
          .insert(symptomInserts);

        if (symptomError) throw symptomError;
      }

      // 3. Create AI diagnosis if diagnosis exists
      if (diagnosis) {
        const { data: aiDiagnosis, error: diagError } = await supabase
          .from("ai_diagnoses")
          .insert({
            consultation_id: consultation.id,
            possible_condition: diagnosis,
            explanation: "AI-generated diagnosis from symptom analysis"
          })
          .select()
          .single();

        if (diagError) throw diagError;

        // 4. Link equipment if available
        if (equipment.length > 0) {
          // Get existing equipment IDs
          const { data: existingEquipment } = await supabase
            .from("equipment")
            .select("id,name")
            .in("name", equipment);

          const equipmentInserts = equipment.map(name => ({
            diagnosis_id: aiDiagnosis.id,
            equipment_id: existingEquipment?.find(e => e.name === name)?.id || null,
            equipment_name: name
          }));

          const { error: equipError } = await supabase
            .from("diagnosis_equipment")
            .insert(equipmentInserts);

          if (equipError) throw equipError;
        }
      }

      // 5. Create the appointment
      const formattedDate = selectedDate.toISOString().split('T')[0];
      const endTime = calculateEndTime(selectedTime);

      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .insert({
          consultation_id: consultation.id,
          clinic_id: clinic.id,
          pet_id: selectedPet,
          owner_id: user.id,
          appointment_date: formattedDate,
          start_time: selectedTime,
          end_time: endTime,
          status: "pending",
          is_ai_booking: true
        })
        .select(`
          *,
          clinic:clinic_id(*),
          pet:pet_id(*),
          consultation:consultation_id(
            *,
            consultation_symptoms(
              symptom:symptom_id(*)
            ),
            ai_diagnoses(
              *,
              diagnosis_equipment(
                equipment:equipment_id(*)
              )
            )
          )
        `)
        .single();

      if (appointmentError) throw appointmentError;

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.message || "Failed to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Appointment Booked!</h3>
            <p className="text-gray-600 mb-6">
              Your appointment with {clinic.clinic_name} has been successfully scheduled.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">{clinic.clinic_name}</h3>
          <p className="text-sm text-gray-700">
            {clinic.address}, {clinic.city}
          </p>
          {clinic.contact_number && (
            <p className="text-sm text-gray-700 mt-1">Contact: {clinic.contact_number}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Pet Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Pet
              </label>
              <select
                value={selectedPet}
                onChange={(e) => setSelectedPet(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={isSubmitting}
              >
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.pet_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  minDate={new Date()}
                  filterDate={isWeekday}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10"
                  required
                  disabled={isSubmitting || loadingTimes}
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="mb-4">
                <div className="flex items-center text-gray-700 mb-2">
                  <Clock className="mr-2 h-5 w-5 text-gray-400" />
                  <span className="font-medium">{formatDate(selectedDate)}</span>
                </div>
                
                {isHoliday(selectedDate) ? (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 text-center">
                    <p>The clinic is closed on this day (holiday)</p>
                  </div>
                ) : loadingTimes ? (
                  <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                    <Loader2 className="animate-spin h-5 w-5 text-blue-500 mx-auto" />
                    <p className="mt-2 text-blue-700">Loading available times...</p>
                  </div>
                ) : availableTimes.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {availableTimes.map(time => {
                      const isPast = isPastTime(selectedDate, time);
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => !isPast && setSelectedTime(time)}
                          className={`p-2 rounded-lg border text-sm transition-colors ${
                            isPast
                              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                              : selectedTime === time
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white border-blue-200 hover:bg-blue-50 text-blue-700'
                          }`}
                          disabled={isSubmitting || isPast}
                          title={isPast ? 'This time has already passed' : ''}
                        >
                          {time}
                          {isPast && <Clock className="ml-1 inline h-3 w-3" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 text-center">
                    <p>No available times for this date</p>
                    <p className="text-sm mt-1">The clinic may be closed or fully booked</p>
                  </div>
                )}
                {!selectedTime && availableTimes.length > 0 && (
                  <p className="mt-1 text-sm text-red-600">Please select a time</p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || loadingTimes || !selectedTime || !selectedPet}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isSubmitting || loadingTimes || !selectedTime || !selectedPet
                  ? "bg-blue-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin inline mr-2 h-4 w-4" />
                  Booking...
                </>
              ) : (
                "Confirm Appointment"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookingModal;