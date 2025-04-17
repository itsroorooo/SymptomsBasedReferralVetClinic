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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

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

      const symptomInserts = selectedSymptoms.map(symptomId => ({
        consultation_id: consultation.id,
        symptom_id: symptomId
      }));

      await supabase.from("consultation_symptoms").insert(symptomInserts);

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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            Pet Health <span className="text-blue-600">Diagnosis</span>
          </h1>
          <p className="text-lg text-gray-600">
            Help your pet feel better with AI-powered analysis
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Pet Type Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-800">
              What type of pet do you have?<span className="text-red-500">*</span>
            </label>
            <select
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-700 font-medium"
              required
            >
              <option value="" hidden disabled>
                Select your pet type...
              </option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="rabbit">Rabbit</option>
              <option value="bird">Bird</option>
            </select>
          </div>

          {/* Symptoms Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-800">
              Select observed symptoms<span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-3 border-2 border-gray-200 rounded-xl scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-50">
              {symptoms.map((symptom) => (
                <div
                  key={symptom.id}
                  onClick={() => handleSymptomToggle(symptom.id)}
                  className={`p-4 border-2 rounded-xl cursor-pointer flex items-start justify-between transition-all ${
                    selectedSymptoms.includes(symptom.id)
                      ? "bg-blue-50 border-blue-300 shadow-md"
                      : "bg-white border-gray-200 hover:border-blue-200"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{symptom.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{symptom.description}</p>
                  </div>
                  {selectedSymptoms.includes(symptom.id) ? (
                    <CheckCircle className="text-blue-600 ml-2 flex-shrink-0 h-5 w-5" />
                  ) : (
                    <Circle className="text-gray-400 ml-2 flex-shrink-0 h-5 w-5" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-800">
              Additional details about your pet's condition
            </label>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all min-h-[150px]"
              placeholder="When did symptoms start? Any behavior changes? Eating habits? Other observations..."
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !petType || selectedSymptoms.length === 0}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all flex justify-center items-center ${
              isSubmitting || !petType || selectedSymptoms.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-lg"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-3 h-6 w-6" />
                Analyzing Symptoms...
              </>
            ) : (
              "Get AI Diagnosis"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Our AI will analyze your pet's symptoms and provide recommendations within minutes</p>
        </div>
      </div>
    </div>
  );
}