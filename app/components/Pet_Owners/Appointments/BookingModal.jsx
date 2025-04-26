"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Calendar, Clock, Loader2, CheckCircle, XCircle } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const BookingModal = ({ clinic, onClose }) => {
  const supabase = createClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [selectedPet, setSelectedPet] = useState("");
  const [pets, setPets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setIsLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", user.id);

        if (error) throw error;

        setPets(data || []);
        if (data?.length > 0) setSelectedPet(data[0].id);
      } catch (err) {
        console.error("Error fetching pets:", err);
        setError("Failed to load pets");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate inputs
      if (!selectedPet) throw new Error("Please select a pet");
      if (!selectedDate) throw new Error("Please select a date");
      if (!selectedTime) throw new Error("Please select a time");

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
          pet_type: pet.pet_type
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
            possible_condition: { diagnosis },
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
  
  const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    let endHours = hours + 1;
    if (endHours >= 24) endHours = 0;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
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
                />
                <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Time
              </label>
              <div className="relative">
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 pl-10 appearance-none"
                  required
                >
                  {generateTimeSlots().map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>


            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-2 px-4 rounded-md text-white font-medium ${
                isSubmitting
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