import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export async function generatePetDiagnosis(petType, symptomsList, additionalInfo) {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const symptomsText = symptomsList.join(', ');
  
  const prompt = `
  You are a veterinary AI assistant. Analyze the following pet symptoms and provide:
  1. A possible diagnosis (be conservative, list as "Possible Condition")
  2. Recommended diagnostic tests/equipment needed (from standard veterinary tools)
  3. Brief explanation of your reasoning

  Pet Type: ${petType}
  Symptoms: ${symptomsText}
  Additional Info: ${additionalInfo || 'None provided'}

  Respond in JSON format with these keys:
  - possible_condition
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

    const content = response.choices[0].message.content;
    return JSON.parse(content);
  } catch (error) {
    console.error("OpenAI error:", error);
    throw new Error("Failed to generate diagnosis. Please try again later.");
  }
}