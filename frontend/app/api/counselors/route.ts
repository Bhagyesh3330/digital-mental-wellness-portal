import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// GET /api/counselors - Get all active counselors for appointment booking
export async function GET(request: Request) {
  try {
    // Get all active counselors from the database
    const counselors = userModel.getUsersByRole('counselor');
    
    // Transform to the format expected by the frontend
    const counselorsData = counselors.map(counselor => ({
      id: counselor.id,
      firstName: counselor.firstName,
      lastName: counselor.lastName,
      email: counselor.email,
      specialization: counselor.specialization || 'General Counseling',
      experience: counselor.experience || 'Experienced Professional',
      phone: counselor.phone,
      licenseNumber: counselor.licenseNumber,
      qualifications: counselor.qualifications
    }));
    
    console.log(`Found ${counselorsData.length} active counselors`);
    
    return NextResponse.json({
      success: true,
      counselors: counselorsData,
      count: counselorsData.length
    });
    
  } catch (error) {
    console.error('Error fetching counselors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch counselors' },
      { status: 500 }
    );
  }
}
