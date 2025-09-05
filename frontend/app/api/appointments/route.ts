import { NextResponse } from 'next/server';
import { appointmentModel } from '@/lib/database/models/appointments';
import { userModel } from '@/lib/database/models/users';

// GET /api/appointments - Get appointments for current user
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const userRole = url.searchParams.get('userRole') as 'student' | 'counselor';
    
    if (!userId || !userRole) {
      return NextResponse.json(
        { success: false, error: 'User ID and role are required' },
        { status: 400 }
      );
    }
    
    const appointments = appointmentModel.getAppointmentsForUser(parseInt(userId), userRole);
    
    console.log(`Found ${appointments.length} appointments for ${userRole} ${userId}`);
    
    return NextResponse.json({
      success: true,
      appointments: appointments
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST /api/appointments - Create new appointment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, counselorId, appointmentDate, durationMinutes, reason } = body;
    
    // Validate required fields
    if (!studentId || !counselorId || !appointmentDate) {
      return NextResponse.json(
        { success: false, error: 'Student ID, counselor ID, and appointment date are required' },
        { status: 400 }
      );
    }
    
    // Create the appointment
    const appointment = appointmentModel.createAppointment({
      studentId,
      counselorId,
      appointmentDate,
      durationMinutes: durationMinutes || 60,
      reason
    });
    
    console.log('Appointment created:', appointment);
    
    return NextResponse.json({
      success: true,
      appointment: appointment
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// PUT /api/appointments - Update appointment status
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, status, notes } = body;
    
    if (!appointmentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Appointment ID and status are required' },
        { status: 400 }
      );
    }
    
    const success = appointmentModel.updateAppointmentStatus(appointmentId, status, notes);
    
    if (success) {
      const updatedAppointment = appointmentModel.getAppointmentById(appointmentId);
      return NextResponse.json({
        success: true,
        appointment: updatedAppointment
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to update appointment' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
