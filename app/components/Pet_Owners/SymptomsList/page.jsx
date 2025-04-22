"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle, Circle, TestTube2, Hospital } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SymptomPage() {
  const [symptoms, setSymptoms] = useState([]);
  const [pets, setPets] = useState([]); // Added pets state
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [recommendedClinics, setRecommendedClinics] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);

  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY);

  useEffect(() => {
    const fetchSymptoms = async () => {
      const { data, error } = await supabase
        .from("symptoms")
        .select("*")
        .order("name", { ascending: true });

      if (!error) setSymptoms(data || []);
      setIsLoading(false);
    };

    fetchData();
  }, [supabase]);

  // Handle pet selection change
  const handlePetChange = (e) => {
    const petId = e.target.value;
    setSelectedPetId(petId);
    const selectedPet = pets.find(pet => pet.id === petId);
    if (selectedPet) {
      setSelectedPetType(selectedPet.pet_type);
    }
  };

  // Handle symptom selection
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
    let consultation;
  
    try {
      const symptomNames = symptoms
        .filter(symptom => selectedSymptoms.includes(symptom.id))
        .map(symptom => symptom.name);
  
      const response = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType: selectedPet.pet_type,
          symptoms: symptomNames,
          additionalInfo,
          consultationId: consultation.id
        }),
      });
  
      // First check if response exists
      if (!response) {
        throw new Error('No response from server');
      }
  
      // Then check if response is OK
      const text = await response.text();
      
      // If empty response
      if (!text) {
        throw new Error('Empty response from server');
      }
  
      // Now parse JSON
      const data = JSON.parse(text);
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Diagnosis failed');
      }
  
      // Success case
      setDiagnosisResult(data.data);
      setShowResults(true);
  
      // 7. Update consultation status
      await supabase
        .from('pet_consultations')
        .update({ status: 'completed' })
        .eq('id', consultation.id);
  
    } catch (error) {
      console.error('Submission error:', error);
      alert(error.message || 'Failed to get diagnosis');
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

  if (showResults && diagnosisResult) {
    const selectedPet = pets.find(pet => pet.id === selectedPetId);
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              Diagnosis for {selectedPet?.name} <span className="text-blue-600">({selectedPet?.pet_type})</span>
            </h1>
            {selectedPet?.breed && (
              <p className="text-lg text-gray-600">Breed: {selectedPet.breed}</p>
            )}
          </div>

          <div className="space-y-8">
            {/* Diagnosis Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Diagnosis</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Possible Condition</h3>
                  <p className="text-gray-800 text-xl">{diagnosisResult.possible_diagnosis}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Confidence Level</h3>
                  <p className="text-gray-800">
                    {Math.round(diagnosisResult.confidence_level * 100)}%
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700">Explanation</h3>
                  <p className="text-gray-800">{diagnosisResult.explanation}</p>
                </div>
              </div>
            </div>

            {/* Recommended Equipment Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <TestTube2 className="mr-2" /> Recommended Tests & Equipment
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosisResult.recommended_equipment?.map((equipment, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="font-medium text-blue-800">{equipment}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Clinics Card */}
            {recommendedClinics.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                  <Hospital className="mr-2" /> Nearby Clinics with Available Equipment
                </h2>
                <div className="space-y-6">
                  {recommendedClinics.map((clinic, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{clinic.clinic_name}</h3>
                          <p className="text-gray-600">{clinic.address}, {clinic.city}</p>
                          <p className="text-gray-600">{clinic.contact_number}</p>
                        </div>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                          Book Appointment
                        </button>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold text-gray-700">Available Equipment:</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {clinic.equipment && (
                            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {clinic.equipment.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button 
                onClick={() => router.push(`/components/Pet_Owners/Map?diagnosis=${encodeURIComponent(diagnosisResult.possible_condition)}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center mx-auto"
              >
                <Hospital className="mr-2" />
                Find Suitable Clinics
              </button>
            </div>
          </div>
        </div>
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
          {/* Pet Selection */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-800">
              Select your pet<span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPetId}
              onChange={handlePetChange}
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-gray-700 font-medium"
              required
            >
              <option value="" hidden disabled>
                {pets.length ? "Select your pet..." : "No pets found - please add a pet first"}
              </option>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.pet_type}) {pet.breed && `- ${pet.breed}`}
                </option>
              ))}
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
                    {symptom.pet_type && (
                      <p className="text-xs text-gray-500 mt-1">
                        Common in: {symptom.pet_type}s
                      </p>
                    )}
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
            disabled={isSubmitting || !selectedPetId || selectedSymptoms.length === 0}
            className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all flex justify-center items-center ${
              isSubmitting || !selectedPetId || selectedSymptoms.length === 0
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