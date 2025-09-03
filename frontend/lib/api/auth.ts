import axios from 'axios';
import { LoginCredentials, RegisterData, User, ApiResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const authClient = axios.create({
  baseURL: `${API_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await authClient.post('/login', credentials);
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  register: async (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    try {
      const response = await authClient.post('/register', data);
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
        details: error.response?.data?.details
      };
    }
  },

  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    try {
      const response = await authClient.get('/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch profile'
      };
    }
  },

  refreshToken: async (token: string): Promise<ApiResponse<{ token: string }>> => {
    try {
      const response = await authClient.post('/refresh', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Token refresh failed'
      };
    }
  },

  logout: async (token: string): Promise<ApiResponse<any>> => {
    try {
      const response = await authClient.post('/logout', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return {
        success: true,
        message: response.data.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || 'Logout failed'
      };
    }
  }
};
