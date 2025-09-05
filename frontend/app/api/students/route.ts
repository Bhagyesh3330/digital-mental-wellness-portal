import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// GET /api/students - Get all students (for counselor dashboard)
export async function GET(request: Request) {
  try {
    // Get all students from the database
    const students = userModel.getUsersByRole('student');
    
    console.log(`Found ${students.length} students in database`);
    
    // Return the students data
    return NextResponse.json({
      success: true,
      students: students,
      count: students.length
    });
    
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}
