"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle, Circle } from "lucide-react";

export default function SymptomPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [petType, setPetType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Fetch all general symptoms
  useEffect(() => {
    const fetchSymptoms = async () => {
      const { data, error } = await supabase
        .from("symptoms")
        .select("*")
        .order("name", { ascending: true });

      if (!error) setSymptoms(data || []);
      setIsLoading(false);
    };

    fetchSymptoms();
  }, []);

  const handleSymptomToggle = (symptomId) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptomId)
        ? prev.filter(id => id !== symptomId)
        : [...prev, symptomId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create consultation
      const { data: consultation, error: consultError } = await supabase
        .from("pet_consultations")
        .insert({
          owner_id: user.id,
          pet_type: petType,
          additional_info: additionalInfo,
          status: "pending"
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // Link selected symptoms
      const symptomInserts = selectedSymptoms.map(symptomId => ({
        consultation_id: consultation.id,
        symptom_id: symptomId
      }));

      await supabase.from("consultation_symptoms").insert(symptomInserts);

      // Trigger AI diagnosis
      const { error: aiError } = await supabase
        .rpc('trigger_ai_diagnosis', { consultation_id: consultation.id });

      if (aiError) throw aiError;

      alert("Symptoms submitted! AI diagnosis will be ready shortly.");
      
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting symptoms");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-12 w-12 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Report Pet Symptoms</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Pet Type Selection */}
        <div className="space-y-2">
          <label className="block font-medium">Pet Type*</label>
          <select
            value={petType}
            onChange={(e) => setPetType(e.target.value)}
            className="w-full p-3 border rounded-lg"
            required
          >
            <option value="">Select pet type</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="rabbit">Rabbit</option>
            <option value="bird">Bird</option>
          </select>
        </div>

        {/* Symptoms Selection */}
        <div className="space-y-2">
          <label className="block font-medium">Select Symptoms*</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2 border rounded-lg">
            {symptoms.map(symptom => (
              <div
                key={symptom.id}
                onClick={() => handleSymptomToggle(symptom.id)}
                className={`p-3 border rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                  selectedSymptoms.includes(symptom.id)
                    ? "bg-blue-50 border-blue-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-medium">{symptom.name}</p>
                  <p className="text-sm text-gray-600">{symptom.description}</p>
                </div>
                {selectedSymptoms.includes(symptom.id) ? (
                  <CheckCircle className="text-blue-500" />
                ) : (
                  <Circle className="text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-2">
          <label className="block font-medium">Additional Information</label>
          <textarea
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            className="w-full p-3 border rounded-lg min-h-[120px]"
            placeholder="When did symptoms start? Any other observations?"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !petType || selectedSymptoms.length === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex justify-center items-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            "Generate AI Diagnosis"
          )}
        </button>
      </form>
    </div>
  );
}