import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function generatePetDiagnosis(petType, symptomsList, additionalInfo = '') {
  try {
    const symptomsText = symptomsList.join(', ') || 'No specific symptoms';
    
    const prompt = `
    As a veterinary AI assistant, analyze these symptoms and provide:
    {
      "possible_condition": "[Most likely condition]",
      "recommended_equipment": ["List", "Of", "Equipment"],
      "explanation": "Brief clinical explanation"
    }

    Strictly use this JSON format. Do not include any additional text.

    Patient Details:
    - Species: ${petType}
    - Symptoms: ${symptomsText}
    - Additional Info: ${additionalInfo || 'None'}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { 
          role: "system", 
          content: "You are a veterinary diagnostic assistant. Respond ONLY with valid JSON matching the exact structure provided." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    });

    const rawResponse = response.choices[0]?.message?.content;
    console.log('Raw AI Response:', rawResponse);

    if (!rawResponse) throw new Error("Empty response from AI service");

    const parsedResponse = JSON.parse(rawResponse);
    
    // Validate response structure
    const requiredFields = ['possible_condition', 'recommended_equipment', 'explanation'];
    const missingFields = requiredFields.filter(field => !(field in parsedResponse));
    
    if (missingFields.length > 0) {
      throw new Error(`AI response missing required fields: ${missingFields.join(', ')}`);
    }

    // Transform and validate values
    return {
      possible_condition: parsedResponse.possible_condition.toString(),
      recommended_equipment: Array.isArray(parsedResponse.recommended_equipment)
        ? parsedResponse.recommended_equipment.map(String)
        : [],
      explanation: parsedResponse.explanation.toString()
    };

  } catch (error) {
    console.error('OpenAI Processing Error:', {
      error: error.message,
      stack: error.stack,
      input: { petType, symptomsList, additionalInfo }
    });
    throw new Error(`AI processing failed: ${error.message}`);
  }
}