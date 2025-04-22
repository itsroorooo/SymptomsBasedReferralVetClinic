import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export async function generatePetDiagnosis(petType, symptomsList, additionalInfo = '') {
  if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured");
  }

  const symptomsText = symptomsList.join(', ');
  
  const prompt = `
  As a veterinary AI assistant, analyze these symptoms and provide:
  1. Possible diagnosis (as "possible_condition")
  2. Confidence level (0-1 as "confidence_level")
  3. Recommended standard veterinary equipment/tests (as array "recommended_equipment")
  4. Brief explanation ("explanation")

  Respond in strict JSON format only.

  Details:
  Pet: ${petType}
  Symptoms: ${symptomsText}
  Additional Info: ${additionalInfo || 'None'}
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

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("No content in AI response");

    const result = JSON.parse(content);
    
    // Validate and transform response
    return {
      possible_condition: result.possible_condition || result.possible_diagnosis || "Unknown condition",
      confidence_level: typeof result.confidence_level === 'number' ? result.confidence_level : 0,
      recommended_equipment: Array.isArray(result.recommended_equipment) 
        ? result.recommended_equipment.filter(e => typeof e === 'string')
        : [],
      explanation: result.explanation || "No explanation provided"
    };

  } catch (error) {
    console.error('OpenAI API Error:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`AI service error: ${error.message}`);
  }
}