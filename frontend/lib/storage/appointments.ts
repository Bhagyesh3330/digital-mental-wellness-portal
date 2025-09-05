// Shared appointments storage utility
// This simulates a database by using localStorage

import { getUsersByRole, getUserById } from './users';

export interface StoredAppointment {
  id: number;
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  reason?: string;
  counselorFirstName?: string;
  counselorLastName?: string;
  studentFirstName?: string;
  studentLastName?: string;
  createdAt: string;
  updatedAt: string;
}

const APPOINTMENTS_KEY = 'wellness_appointments';
const APPOINTMENT_ID_KEY = 'wellness_appointment_next_id';

// Get next available ID
const getNextId = (): number => {
  if (typeof window === 'undefined') return 1;
  
  const stored = localStorage.getItem(APPOINTMENT_ID_KEY);
  const nextId = stored ? parseInt(stored, 10) + 1 : 1;
  localStorage.setItem(APPOINTMENT_ID_KEY, nextId.toString());
  return nextId;
};

// Get all appointments from localStorage
export const getAllAppointments = (): StoredAppointment[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(APPOINTMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading appointments from localStorage:', error);
    return [];
  }
};

// Save appointments to localStorage
export const saveAllAppointments = (appointments: StoredAppointment[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(appointments));
  } catch (error) {
    console.error('Error saving appointments to localStorage:', error);
  }
};

// Get appointments for a specific user
export const getAppointmentsForUser = (userId: number, userRole: 'student' | 'counselor'): StoredAppointment[] => {
  const allAppointments = getAllAppointments();
  
  if (userRole === 'student') {
    return allAppointments.filter(apt => apt.studentId === userId);
  } else if (userRole === 'counselor') {
    return allAppointments.filter(apt => apt.counselorId === userId);
  }
  
  return [];
};

// Create a new appointment
export const createAppointment = (appointmentData: {
  studentId: number;
  counselorId: number;
  appointmentDate: string;
  durationMinutes?: number;
  reason?: string;
  counselorFirstName?: string;
  counselorLastName?: string;
  studentFirstName?: string;
  studentLastName?: string;
}): StoredAppointment => {
  const allAppointments = getAllAppointments();
  
  const newAppointment: StoredAppointment = {
    id: getNextId(),
    studentId: appointmentData.studentId,
    counselorId: appointmentData.counselorId,
    appointmentDate: appointmentData.appointmentDate,
    durationMinutes: appointmentData.durationMinutes || 60,
    status: 'scheduled',
    reason: appointmentData.reason,
    counselorFirstName: appointmentData.counselorFirstName,
    counselorLastName: appointmentData.counselorLastName,
    studentFirstName: appointmentData.studentFirstName,
    studentLastName: appointmentData.studentLastName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  allAppointments.push(newAppointment);
  saveAllAppointments(allAppointments);
  
  return newAppointment;
};

// Update appointment status
export const updateAppointmentStatus = (appointmentId: number, status: StoredAppointment['status']): boolean => {
  const allAppointments = getAllAppointments();
  const appointmentIndex = allAppointments.findIndex(apt => apt.id === appointmentId);
  
  if (appointmentIndex === -1) return false;
  
  allAppointments[appointmentIndex].status = status;
  allAppointments[appointmentIndex].updatedAt = new Date().toISOString();
  
  saveAllAppointments(allAppointments);
  return true;
};

// Get registered counselors for student booking
export const getRegisteredCounselors = () => {
  const counselors = getUsersByRole('counselor');
  return counselors.map(counselor => ({
    id: counselor.id,
    firstName: counselor.firstName,
    lastName: counselor.lastName,
    email: counselor.email,
    specialization: counselor.specialization || 'General Counseling',
    yearsOfExperience: parseInt(counselor.experience?.split(' ')[0] || '5'),
    isApproved: true,
    isActive: counselor.isActive
  }));
};

// Get registered students for counselor booking
export const getRegisteredStudents = () => {
  const students = getUsersByRole('student');
  return students.map(student => ({
    id: student.id,
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email,
    hostelName: student.hostelName,
    roomNumber: student.roomNumber,
    course: student.course,
    yearOfStudy: student.yearOfStudy
  }));
};

// Mark appointment as completed (counselor function)
export const markAppointmentCompleted = (appointmentId: number, notes?: string): boolean => {
  const allAppointments = getAllAppointments();
  const appointmentIndex = allAppointments.findIndex(apt => apt.id === appointmentId);
  
  if (appointmentIndex === -1) return false;
  
  allAppointments[appointmentIndex].status = 'completed';
  allAppointments[appointmentIndex].updatedAt = new Date().toISOString();
  if (notes) {
    allAppointments[appointmentIndex].reason = notes; // Use reason field to store completion notes
  }
  
  saveAllAppointments(allAppointments);
  console.log('Appointment marked as completed:', appointmentId);
  return true;
};

// Initialize with some sample data if empty (only if not explicitly cleaned)
export const initializeSampleAppointments = (userId: number, userRole: 'student' | 'counselor'): void => {
  const existing = getAllAppointments();
  if (existing.length > 0) return; // Already has data
  
  // Create sample appointments using registered users
  const students = getUsersByRole('student');
  const counselors = getUsersByRole('counselor');
  
  if (students.length === 0 || counselors.length === 0) return; // Need users first
  
  const sampleAppointments: StoredAppointment[] = [
    {
      id: 1,
      studentId: students[0].id, // First registered student
      counselorId: counselors[0].id, // First registered counselor
      appointmentDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      durationMinutes: 60,
      status: 'scheduled',
      reason: 'Anxiety management consultation',
      counselorFirstName: counselors[0].firstName,
      counselorLastName: counselors[0].lastName,
      studentFirstName: students[0].firstName,
      studentLastName: students[0].lastName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  
  // Only add if we have actual registered users
  if (students.length > 0 && counselors.length > 0) {
    saveAllAppointments(sampleAppointments);
    localStorage.setItem(APPOINTMENT_ID_KEY, '2');
    console.log('Sample appointments initialized with registered users');
  }
};
