import { NextResponse } from 'next/server';
import { appointmentModel } from '@/lib/database/models/appointments';

// PUT /api/appointments/[id]/complete - Complete an appointment
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const appointmentId = parseInt(params.id);
    
    if (isNaN(appointmentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid appointment ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { notes } = body;
    
    console.log('Completing appointment:', appointmentId, 'with notes:', notes);
    
    const success = appointmentModel.updateAppointmentStatus(appointmentId, 'completed', notes || 'Session completed successfully');
    
    if (success) {
      const updatedAppointment = appointmentModel.getAppointmentById(appointmentId);
      console.log('Appointment completed successfully:', updatedAppointment);
      
      return NextResponse.json({
        success: true,
        appointment: updatedAppointment
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Appointment not found or could not be completed' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error completing appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to complete appointment' },
      { status: 500 }
    );
  }
}
