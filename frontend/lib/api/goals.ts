import { WellnessGoal, ApiResponse } from '@/types';

export interface CreateGoalData {
  title: string;
  description?: string;
  target_date?: string;
}

export interface UpdateProgressData {
  progress_percentage: number;
  progress_note?: string;
}

export const goalsApi = {
  // Create a new wellness goal
  createGoal: async (data: CreateGoalData & { userId: number }): Promise<ApiResponse<{ goal: WellnessGoal }>> => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { success: false, error: responseData.error || 'Failed to create goal' };
      }
      
      return { 
        success: true, 
        data: { goal: responseData.goal },
        message: 'Goal created successfully'
      };
    } catch (error: any) {
      console.error('Goals API Error:', error);
      return {
        success: false,
        error: 'Failed to create goal'
      };
    }
  },

  // Get goals for a specific user
  getGoalsByUser: async (userId: number): Promise<ApiResponse<{ goals: WellnessGoal[] }>> => {
    try {
      const response = await fetch(`/api/goals/user/${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch goals' };
      }
      
      return {
        success: true,
        data: { goals: data.goals }
      };
    } catch (error: any) {
      console.error('Goals API Error:', error);
      return {
        success: false,
        error: 'Failed to fetch goals'
      };
    }
  },

  // Update goal progress
  updateProgress: async (goalId: number, data: UpdateProgressData): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { success: false, error: responseData.error || 'Failed to update progress' };
      }
      
      return {
        success: true,
        data: { goal: responseData.goal },
        message: 'Progress updated successfully'
      };
    } catch (error: any) {
      console.error('Goals API Error:', error);
      return {
        success: false,
        error: 'Failed to update progress'
      };
    }
  },

  // Alias for getGoalsByUser to maintain compatibility
  getGoalsForUser: async (userId: number): Promise<ApiResponse<{ goals: WellnessGoal[] }>> => {
    return goalsApi.getGoalsByUser(userId);
  }
};

// Export the function for direct import
export const getGoalsForUser = goalsApi.getGoalsForUser;
