import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

/**
 * Generates a pet diagnosis based on symptoms
 * @param {string} petType - Type of pet (dog, cat, etc.)
 * @param {string[]} symptomsList - Array of symptom names
 * @param {string} additionalInfo - Additional context about the pet's condition
 * @returns {Promise<Object>} - AI diagnosis result
 */
export async function generatePetDiagnosis(petType, symptomsList, additionalInfo) {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const symptomsText = symptomsList.join(', ');
  
  const prompt = `
  You are a veterinary AI assistant. Analyze the following pet symptoms and provide:
  1. A possible diagnosis (be conservative, list as "Possible Condition")
  2. Confidence level (0-1)
  3. Recommended diagnostic tests/equipment needed (from standard veterinary tools)
  4. Brief explanation of your reasoning

  Details:
  Pet: ${petType}
  Symptoms: ${symptomsText}
  Additional Info: ${additionalInfo || 'None provided'}

  Respond in JSON format with these keys:
  - possible_diagnosis
  - confidence_level
  - recommended_equipment (array of equipment names)
  - explanation
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a veterinary assistant. Respond ONLY with valid JSON." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("OpenAI error:", error);
    throw error;
  }
}