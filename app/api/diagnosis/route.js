import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/utils/supabase/server';
import { generatePetDiagnosis } from '@/utils/openai';

export async function POST(request) {
  const supabase = createSupabaseServerClient();

  try {
    // Validate request format
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 415 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    if (!body.petType || !Array.isArray(body.symptoms)) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate diagnosis with validation
    const result = await generatePetDiagnosis(
      body.petType.toLowerCase().trim(),
      body.symptoms.filter(s => typeof s === 'string'),
      typeof body.additionalInfo === 'string' ? body.additionalInfo : ''
    );

    console.log('Validated AI Response:', {
      possible_condition: result.possible_condition,
      equipment_count: result.recommended_equipment.length,
      explanation_length: result.explanation.length
    });

    return NextResponse.json({
      success: true,
      data: {
        possible_condition: result.possible_condition,
        recommended_equipment: result.recommended_equipment,
        explanation: result.explanation
      }
    });

  } catch (error) {
    // Detailed server-side logging
    console.error('API Server Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack
        })
      },
      { status: 500 }
    );
  }
}
