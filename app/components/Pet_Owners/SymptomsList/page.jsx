"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle, Circle, TestTube2, Hospital } from "lucide-react";
import { useRouter } from "next/navigation";


export default function SymptomPage() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState([]);
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("");
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("User not authenticated");

        const [{ data: petsData, error: petsError }, 
               { data: symptomsData, error: symptomsError }] = await Promise.all([
          supabase.from("pets").select("*").eq("owner_id", user.id),
          supabase.from("symptoms").select("*").order("name", { ascending: true })
        ]);

        if (petsError) throw petsError;
        if (symptomsError) throw symptomsError;

        setPets(petsData || []);
        setSymptoms(symptomsData || []);

      } catch (error) {
        console.error("Fetch error:", error);
        alert("Failed to load data: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

  const handlePetChange = (e) => {
    const petId = e.target.value;
    setSelectedPetId(petId);
    const selectedPet = pets.find(pet => pet.id === petId);
    if (selectedPet) {
      setSelectedPetType(selectedPet.pet_type);
    }
  };

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
      if (!selectedPetId) throw new Error("Please select a pet");
      if (selectedSymptoms.length === 0) throw new Error("Please select at least one symptom");
      
      const selectedPet = pets.find(pet => pet.id === selectedPetId);
      if (!selectedPet) throw new Error("Invalid pet selection");

      const apiResponse = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType: selectedPet.pet_type,
          symptoms: selectedSymptoms.map(id => 
            symptoms.find(s => s.id === id)?.name || 'unknown'
          ),
          additionalInfo
        }),
      });
  
      if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        throw new Error(`API Error ${apiResponse.status}: ${errorBody}`);
      }
  
      const responseData = await apiResponse.json();
      console.log('API Response:', responseData);

      if (!responseData.data?.possible_condition) {
        throw new Error('Invalid diagnosis response');
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { data: consultation, error: consultError } = await supabase
        .from('pet_consultations')
        .insert({
          pet_id: selectedPetId,
          owner_id: user.id,
          additional_info: additionalInfo
        })
        .select()
        .single();

      if (consultError) throw consultError;

      // Save symptoms
      const symptomRows = selectedSymptoms.map(symptomId => ({
        consultation_id: consultation.id,
        symptom_id: symptomId
      }));

      if (symptomRows.length > 0) {
        const { error: symptomError } = await supabase
          .from('consultation_symptoms')
          .insert(symptomRows);
        if (symptomError) throw symptomError;
      }

      // Save diagnosis (without equipment first)
      const { data: diagnosis, error: diagnosisError } = await supabase
        .from('ai_diagnoses')
        .insert({
          consultation_id: consultation.id,
          possible_condition: responseData.data.possible_condition,
          explanation: responseData.data.explanation
        })
        .select()
        .single();

      if (diagnosisError) throw diagnosisError;

      // Save recommended equipment to diagnosis_equipment table
      if (responseData.data.recommended_equipment?.length > 0) {
        // First get all equipment IDs that match the recommended names
        const { data: equipmentData, error: equipmentError } = await supabase
          .from('equipment')
          .select('id, name')
          .in('name', responseData.data.recommended_equipment);

        if (equipmentError) throw equipmentError;

        // Create array of equipment to insert
        const equipmentInserts = responseData.data.recommended_equipment.map(equipName => {
          const equipment = equipmentData.find(e => e.name === equipName);
          return {
            diagnosis_id: diagnosis.id,
            equipment_id: equipment?.id || null,
            equipment_name: equipName
          };
        });

        const { error: equipmentInsertError } = await supabase
          .from('diagnosis_equipment')
          .insert(equipmentInserts);

        if (equipmentInsertError) throw equipmentInsertError;
      }

      // Set the diagnosis result and show it
      setDiagnosisResult(responseData.data);
      setShowResults(true);

    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFindClinics = () => {
    const queryParams = new URLSearchParams({
      diagnosis: encodeURIComponent(diagnosisResult.possible_condition),
      equipment: encodeURIComponent(JSON.stringify(diagnosisResult.recommended_equipment || [])),
      symptomIds: encodeURIComponent(JSON.stringify(selectedSymptoms || []))
    }).toString();
    
    router.push(`/components/Pet_Owners/FilteredMap?${queryParams}`);
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
                  <p className="text-gray-800 text-xl">{diagnosisResult.possible_condition}</p>
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

            <div className="text-center">
              <button 
                onClick={handleFindClinics}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-3 border-2 border-gray-200 rounded-xl">
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