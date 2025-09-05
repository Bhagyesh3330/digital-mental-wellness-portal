export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor';
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  course?: string;
  yearOfStudy?: number;
  studentId?: string;
  dateOfBirth?: string;
  specialization?: string;
  experience?: string;
  licenseNumber?: string;
  qualifications?: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor';
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  course?: string;
  yearOfStudy?: number;
  dateOfBirth?: string;
  studentId?: string;
  specialization?: string;
  experience?: string;
  profileData?: {
    guardianContact?: string;
    licenseNumber?: string;
    qualifications?: string;
    department?: string;
    permissions?: Record<string, string>;
  };
}

export interface MoodEntry {
  id: number;
  userId: number;
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel: number;
  sleepHours: number;
  stressLevel: number;
  createdAt: string;
}

export interface WellnessGoal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetDate?: string;
  isCompleted: boolean;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
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

export interface Resource {
  id: number;
  title: string;
  content: string;
  resourceType: string;
  category: string;
  authorId?: number;
  authorFirstName?: string;
  authorLastName?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
