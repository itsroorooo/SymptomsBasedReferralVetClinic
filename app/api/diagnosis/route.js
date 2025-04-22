import { NextResponse } from 'next/server';
import { generatePetDiagnosis } from '@/utils/openai';

export const dynamic = 'force-dynamic'; // Ensure this API route is dynamic

export async function POST(request) {
  try {
    // 1. Validate request
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 415 }
      );
    }

    // 2. Parse body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // 3. Validate fields
    const { petType, symptoms, additionalInfo } = body;
    
    if (!petType || typeof petType !== 'string') {
      return NextResponse.json(
        { error: 'Valid petType is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(symptoms)) {
      return NextResponse.json(
        { error: 'Symptoms must be an array' },
        { status: 400 }
      );
    }

    if (symptoms.length === 0) {
      return NextResponse.json(
        { error: 'At least one symptom is required' },
        { status: 400 }
      );
    }

    // 4. Generate diagnosis
    const diagnosis = await generatePetDiagnosis(
      petType.toLowerCase(),
      symptoms.filter(s => typeof s === 'string'),
      typeof additionalInfo === 'string' ? additionalInfo : ''
    );

    // 5. Return standardized response
    return NextResponse.json({
      data: {
        possible_condition: diagnosis.possible_condition,
        explanation: diagnosis.explanation,
        recommended_equipment: diagnosis.recommended_equipment,
        confidence_level: diagnosis.confidence_level
      }
    });

  } catch (error) {
    console.error('Diagnosis API Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      { 
        error: error.message || 'Diagnosis processing failed',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      },
      { status: 500 }
    );
  }
}