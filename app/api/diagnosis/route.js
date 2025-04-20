import { NextResponse } from 'next/server';
import { generatePetDiagnosis } from '@/utils/openai';

export async function POST(request) {
  try {
    // Verify we received JSON
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Expected JSON' },
        { status: 400 }
      );
    }

    const { petType, symptoms, additionalInfo } = await request.json();
    
    // Validate required fields
    if (!petType || !symptoms?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate diagnosis
    const result = await generatePetDiagnosis(petType, symptoms, additionalInfo);
    
    // Ensure we always return valid JSON
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Diagnosis failed' 
      },
      { status: 500 }
    );
  }
}