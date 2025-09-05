import { NextResponse } from 'next/server';
import { appointmentModel } from '@/lib/database/models/appointments';
import { userModel } from '@/lib/database/models/users';

// GET /api/appointments/my - Get appointments for the authenticated user
export async function GET(request: Request) {
  try {
    // Extract the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization token is required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the token using userModel
    const user = userModel.getUserFromToken(token);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    const appointments = appointmentModel.getAppointmentsForUser(user.id, user.role);
    
    console.log(`Found ${appointments.length} appointments for ${user.role} ${user.id}`);
    
    return NextResponse.json({
      success: true,
      appointments: appointments
    });
    
  } catch (error) {
    console.error('Error fetching user appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
