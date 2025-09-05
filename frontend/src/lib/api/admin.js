import apiClient from './apiClient';

/**
 * Admin API functions for managing counselor approvals
 */
export const adminApi = {
  // Get pending counselor registrations
  getPendingCounselors: async () => {
    try {
      const response = await apiClient.get('/api/admin/counselors/pending');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending counselors:', error);
      throw error;
    }
  },

  // Get approved counselors
  getApprovedCounselors: async () => {
    try {
      const response = await apiClient.get('/api/admin/counselors/approved');
      return response.data;
    } catch (error) {
      console.error('Error fetching approved counselors:', error);
      throw error;
    }
  },

  // Get counselor details
  getCounselorDetails: async (counselorId) => {
    try {
      const response = await apiClient.get(`/api/admin/counselors/${counselorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching counselor details:', error);
      throw error;
    }
  },

  // Approve counselor
  approveCounselor: async (counselorId, adminNotes = '') => {
    try {
      const response = await apiClient.post(`/api/admin/counselors/${counselorId}/approve`, {
        adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error approving counselor:', error);
      throw error;
    }
  },

  // Reject counselor
  rejectCounselor: async (counselorId, reason, adminNotes = '') => {
    try {
      const response = await apiClient.post(`/api/admin/counselors/${counselorId}/reject`, {
        reason,
        adminNotes
      });
      return response.data;
    } catch (error) {
      console.error('Error rejecting counselor:', error);
      throw error;
    }
  }
};
