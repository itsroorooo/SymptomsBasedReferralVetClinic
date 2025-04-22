"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, CheckCircle, Circle, TestTube2, Hospital } from "lucide-react";

export default function SymptomPage() {
  const [supabase] = useState(() => createClient());
  const [symptoms, setSymptoms] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [petType, setPetType] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [recommendedClinics, setRecommendedClinics] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState(null);
  const [pets, setPets] = useState([]);

  // Fetch user, pets, and symptoms on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // Fetch symptoms
        const { data: symptomsData, error: symptomsError } = await supabase
          .from("symptoms")
          .select("*")
          .order("name", { ascending: true });

        if (symptomsError) throw symptomsError;
        setSymptoms(symptomsData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [supabase]);

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
      // 1. Validate inputs
      if (!petType) throw new Error('Please select a pet type');
      if (selectedSymptoms.length === 0) throw new Error('Please select at least one symptom');
  
      // 2. Get symptom names
      const symptomNames = symptoms
        .filter(s => selectedSymptoms.includes(s.id))
        .map(s => s.name);
  
      // 3. Create consultation record
      const { data: consultationData, error: consultationError } = await supabase
        .from('pet_consultations')
        .insert({
          owner_id: user.id,
          pet_type: petType,
          additional_info: additionalInfo,
          status: 'processing'
        })
        .select()
        .single();
  
      if (consultationError) throw consultationError;
      consultation = consultationData;
  
      // 4. Store symptoms in junction table
      const { error: symptomsError } = await supabase
        .from('consultation_symptoms')
        .insert(selectedSymptoms.map(symptomId => ({
          consultation_id: consultation.id,
          symptom_id: symptomId
    })));
  
      if (symptomsError) throw symptomsError;
  
      // 5. Call AI diagnosis API
      const response = await fetch('/api/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          petType,
          symptoms: symptomNames,
          additionalInfo,
          consultationId: consultation.id
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Diagnosis failed');
      }
  
      const result = await response.json();
      console.log('API Response:', result);
  
      if (!result.success) throw new Error(result.error);
  
      // 6. Display results
      setDiagnosisResult({
        possible_condition: result.data.possible_condition,
        explanation: result.data.explanation,
        recommended_equipment: result.data.recommended_equipment || []
      });
      setShowResults(true);
  
      // 7. Update consultation status
      await supabase
        .from('pet_consultations')
        .update({ status: 'completed' })
        .eq('id', consultation.id);
  
    } catch (error) {
      console.error('Diagnosis error:', error.message);
      
      if (consultation?.id) {
        await supabase
          .from('pet_consultations')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', consultation.id);
      }
  
      alert(`Error: ${error.message}`);
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              Diagnosis <span className="text-blue-600">Results</span>
            </h1>
            <p className="text-lg text-gray-600">
              AI analysis for your {petType}
            </p>
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
                onClick={() => setShowResults(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to symptom selection
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