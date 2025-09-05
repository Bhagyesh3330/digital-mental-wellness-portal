import { NextResponse } from 'next/server';
import { appointmentModel } from '@/lib/database/models/appointments';

// PUT /api/appointments/[id]/cancel - Cancel an appointment
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
    
    console.log('Cancelling appointment:', appointmentId);
    
    const success = appointmentModel.updateAppointmentStatus(appointmentId, 'cancelled', 'Appointment cancelled by user');
    
    if (success) {
      const updatedAppointment = appointmentModel.getAppointmentById(appointmentId);
      console.log('Appointment cancelled successfully:', updatedAppointment);
      
      return NextResponse.json({
        success: true,
        appointment: updatedAppointment
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Appointment not found or could not be cancelled' },
        { status: 404 }
      );
    }
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}
