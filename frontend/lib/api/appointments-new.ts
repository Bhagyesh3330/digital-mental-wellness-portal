// New appointments API utility that uses the database endpoints

export interface AppointmentData {
  id: number;
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  notes?: string;
  studentFirstName?: string;
  studentLastName?: string;
  counselorFirstName?: string;
  counselorLastName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CounselorData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialization?: string;
  experience?: string;
  phone?: string;
  licenseNumber?: string;
  qualifications?: string;
}

export interface StudentData {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  course?: string;
  yearOfStudy?: number;
  studentId?: string;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
}

export interface CreateAppointmentRequest {
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes?: number;
  reason?: string;
}

// Get appointments for a user
export const getUserAppointments = async (userId: number, userRole: 'student' | 'counselor'): Promise<AppointmentData[]> => {
  try {
    const response = await fetch(`/api/appointments?userId=${userId}&userRole=${userRole}`);
    const data = await response.json();
    
    if (data.success) {
      return data.appointments;
    } else {
      console.error('Error fetching appointments:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return [];
  }
};

// Get all active counselors
export const getAllCounselors = async (): Promise<CounselorData[]> => {
  try {
    const response = await fetch('/api/counselors');
    const data = await response.json();
    
    if (data.success) {
      return data.counselors;
    } else {
      console.error('Error fetching counselors:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching counselors:', error);
    return [];
  }
};

// Get all students (for counselors)
export const getAllStudents = async (): Promise<StudentData[]> => {
  try {
    const response = await fetch('/api/students');
    const data = await response.json();
    
    if (data.success) {
      return data.students;
    } else {
      console.error('Error fetching students:', data.error);
      return [];
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

// Create a new appointment
export const createAppointment = async (appointmentData: CreateAppointmentRequest): Promise<{ success: boolean; appointment?: AppointmentData; error?: string }> => {
  try {
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, appointment: data.appointment };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error creating appointment:', error);
    return { success: false, error: error.message || 'Failed to create appointment' };
  }
};

// Update appointment status
export const updateAppointmentStatus = async (
  appointmentId: number, 
  status: AppointmentData['status'], 
  notes?: string
): Promise<{ success: boolean; appointment?: AppointmentData; error?: string }> => {
  try {
    const response = await fetch('/api/appointments', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ appointmentId, status, notes })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, appointment: data.appointment };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message || 'Failed to update appointment' };
  }
};
