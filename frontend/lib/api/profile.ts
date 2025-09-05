import axios from 'axios';
import { ApiResponse } from '@/types';
import Cookies from 'js-cookie';

// Use relative URLs for Next.js API routes
const profileClient = axios.create({
  baseURL: '/api/profile',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
profileClient.interceptors.request.use((config) => {
  // Try to get token from cookies first (where AuthContext stores it)
  const token = Cookies.get('auth_token') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No auth token found for profile API request');
  }
  return config;
});

export interface StudentProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  isActive: boolean;
  createdAt: string;
  studentProfile?: {
    studentId?: string;
    enrollmentNumber?: string;
    course?: string;
    department?: string;
    yearOfStudy?: number;
    admissionYear?: number;
    dateOfBirth?: string;
    guardianName?: string;
    guardianContact?: string;
    emergencyContact?: string;
    emergencyRelation?: string;
    permanentAddress?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalConditions?: string;
  };
}

export interface CounselorProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  counselorProfile?: {
    licenseNumber?: string;
    specialization?: string;
    yearsOfExperience?: number;
    qualifications?: string;
    availabilitySchedule?: Record<string, string[]>;
  };
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  profileData?: {
    studentId?: string;
    enrollmentNumber?: string;
    course?: string;
    department?: string;
    yearOfStudy?: number;
    admissionYear?: number;
    dateOfBirth?: string;
    guardianName?: string;
    guardianContact?: string;
    emergencyContact?: string;
    emergencyRelation?: string;
    permanentAddress?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    bloodGroup?: string;
    allergies?: string;
    medicalConditions?: string;
    specialization?: string;
    yearsOfExperience?: number;
    qualifications?: string;
  };
}

export const profileApi = {
  getStudentProfile: async (): Promise<ApiResponse<StudentProfile>> => {
    try {
      console.log('Attempting to fetch student profile...');
      const token = Cookies.get('auth_token');
      console.log('Auth token available:', !!token);
      
      const response = await profileClient.get('/student');
      console.log('Student profile response:', response.status);
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      console.error('Student profile API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch student profile'
      };
    }
  },

  getCounselorProfile: async (): Promise<ApiResponse<CounselorProfile>> => {
    try {
      const response = await profileClient.get('/counselor');
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch counselor profile'
      };
    }
  },

  updateProfile: async (data: UpdateProfileData): Promise<ApiResponse<StudentProfile | CounselorProfile>> => {
    try {
      console.log('Attempting to update profile with data:', data);
      const token = Cookies.get('auth_token');
      console.log('Auth token available for update:', !!token);
      
      const response = await profileClient.put('/', data);
      console.log('Profile update response:', response.status);
      return {
        success: true,
        data: response.data,
        message: 'Profile updated successfully'
      };
    } catch (error: any) {
      console.error('Profile update API error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to update profile',
        details: error.response?.data?.details
      };
    }
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<any>> => {
    try {
      const response = await profileClient.post('/change-password', {
        currentPassword,
        newPassword
      });
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to change password'
      };
    }
  }
};
