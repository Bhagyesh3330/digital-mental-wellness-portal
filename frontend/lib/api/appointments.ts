import { Appointment, ApiResponse } from '@/types';
import {
  getAppointmentsForUser,
  createAppointment as createAppointmentStorage,
  updateAppointmentStatus,
  markAppointmentCompleted,
  getRegisteredCounselors,
  getRegisteredStudents,
  initializeSampleAppointments
} from '@/lib/storage/appointments';

// Get current user helper
const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export interface CreateAppointmentData {
  counselorId?: number;
  studentId?: number;
  appointmentDate: string;
  durationMinutes?: number;
  reason?: string;
  counselorFirstName?: string;
  counselorLastName?: string;
  studentFirstName?: string;
  studentLastName?: string;
}

export interface Counselor {
  id: number;
  firstName: string;
  lastName: string;
  specialization?: string;
  yearsOfExperience?: number;
  email: string;
}

export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  hostelName?: string;
  roomNumber?: string;
  course?: string;
  yearOfStudy?: number;
}

export const appointmentsApi = {
  // Get appointments for current user
  getMyAppointments: async (): Promise<ApiResponse<{ appointments: Appointment[] }>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            resolve({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }

          // Initialize sample appointments if needed
          initializeSampleAppointments(currentUser.id, currentUser.role as 'student' | 'counselor');
          
          const storedAppointments = getAppointmentsForUser(currentUser.id, currentUser.role as 'student' | 'counselor');
          
          // Convert to Appointment format
          const appointments: Appointment[] = storedAppointments.map(apt => ({
            id: apt.id,
            studentId: apt.studentId,
            counselorId: apt.counselorId,
            appointmentDate: apt.appointmentDate,
            durationMinutes: apt.durationMinutes,
            status: apt.status,
            reason: apt.reason,
            counselorFirstName: apt.counselorFirstName,
            counselorLastName: apt.counselorLastName,
            studentFirstName: apt.studentFirstName,
            studentLastName: apt.studentLastName,
            createdAt: apt.createdAt,
            updatedAt: apt.updatedAt
          }));
          
          resolve({
            success: true,
            data: { appointments }
          });
        } catch (error: any) {
          console.error('Appointments API Error:', error);
          resolve({
            success: false,
            error: 'Failed to fetch appointments'
          });
        }
      }, 100);
    });
  },

  // Get available counselors (only registered ones)
  getCounselors: async (): Promise<ApiResponse<{ counselors: Counselor[] }>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const counselors = getRegisteredCounselors();
          resolve({
            success: true,
            data: { counselors }
          });
        } catch (error: any) {
          console.error('Counselors API Error:', error);
          resolve({
            success: false,
            error: 'Failed to fetch counselors'
          });
        }
      }, 100);
    });
  },

  // Create a new appointment
  createAppointment: async (data: CreateAppointmentData): Promise<ApiResponse<{ appointment: Appointment }>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            resolve({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }

          // Validate required fields
          if (!data.appointmentDate) {
            resolve({
              success: false,
              error: 'Appointment date is required'
            });
            return;
          }

          if (currentUser.role === 'student' && !data.counselorId) {
            resolve({
              success: false,
              error: 'Counselor selection is required'
            });
            return;
          }

          if (currentUser.role === 'counselor' && !data.studentId) {
            resolve({
              success: false,
              error: 'Student selection is required'
            });
            return;
          }

          const newAppointment = createAppointmentStorage({
            studentId: data.studentId || currentUser.id,
            counselorId: data.counselorId || currentUser.id,
            appointmentDate: data.appointmentDate,
            durationMinutes: data.durationMinutes || 60,
            reason: data.reason,
            counselorFirstName: data.counselorFirstName,
            counselorLastName: data.counselorLastName,
            studentFirstName: data.studentFirstName,
            studentLastName: data.studentLastName
          });
          
          // Convert to Appointment format
          const appointment: Appointment = {
            id: newAppointment.id,
            studentId: newAppointment.studentId,
            counselorId: newAppointment.counselorId,
            appointmentDate: newAppointment.appointmentDate,
            durationMinutes: newAppointment.durationMinutes,
            status: newAppointment.status,
            reason: newAppointment.reason,
            counselorFirstName: newAppointment.counselorFirstName,
            counselorLastName: newAppointment.counselorLastName,
            studentFirstName: newAppointment.studentFirstName,
            studentLastName: newAppointment.studentLastName,
            createdAt: newAppointment.createdAt,
            updatedAt: newAppointment.updatedAt
          };
          
          resolve({
            success: true,
            data: { appointment },
            message: 'Appointment created successfully'
          });
        } catch (error: any) {
          console.error('Create Appointment Error:', error);
          resolve({
            success: false,
            error: 'Failed to create appointment'
          });
        }
      }, 100);
    });
  },

  // Get students for a counselor (only registered ones)
  getCounselorStudents: async (): Promise<ApiResponse<{ students: Student[] }>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const students = getRegisteredStudents();
          resolve({
            success: true,
            data: { students }
          });
        } catch (error: any) {
          console.error('Students API Error:', error);
          resolve({
            success: false,
            error: 'Failed to fetch students'
          });
        }
      }, 100);
    });
  },

  // Cancel an appointment
  cancelAppointment: async (appointmentId: number): Promise<ApiResponse<any>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const success = updateAppointmentStatus(appointmentId, 'cancelled');
          
          if (success) {
            resolve({
              success: true,
              message: 'Appointment cancelled successfully'
            });
          } else {
            resolve({
              success: false,
              error: 'Appointment not found'
            });
          }
        } catch (error: any) {
          console.error('Cancel Appointment Error:', error);
          resolve({
            success: false,
            error: 'Failed to cancel appointment'
          });
        }
      }, 100);
    });
  },

  // Complete an appointment (for counselors)
  completeAppointment: async (appointmentId: number, notes?: string): Promise<ApiResponse<any>> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const success = markAppointmentCompleted(appointmentId, notes);
          
          if (success) {
            resolve({
              success: true,
              message: 'Appointment marked as completed'
            });
          } else {
            resolve({
              success: false,
              error: 'Appointment not found'
            });
          }
        } catch (error: any) {
          console.error('Complete Appointment Error:', error);
          resolve({
            success: false,
            error: 'Failed to complete appointment'
          });
        }
      }, 100);
    });
  }
};
