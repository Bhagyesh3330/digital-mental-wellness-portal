// Wellness goals storage system using SQLite database

export interface StoredWellnessGoal {
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

export interface CreateGoalData {
  userId: number;
  title: string;
  description?: string;
  target_date?: string;
}

export interface UpdateProgressData {
  progress_percentage: number;
  progress_note?: string;
}

// API endpoint for goals
const API_BASE = '/api';

// Fetch all goals from database
export const getAllGoals = async (): Promise<StoredWellnessGoal[]> => {
  try {
    const response = await fetch(`${API_BASE}/goals`);
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }
    const data = await response.json();
    return data.goals || [];
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

// Get goals by user ID
export const getGoalsByUserId = async (userId: number): Promise<StoredWellnessGoal[]> => {
  try {
    const response = await fetch(`${API_BASE}/goals/user/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user goals');
    }
    const data = await response.json();
    return data.goals || [];
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return [];
  }
};

// Get goal by ID
export const getGoalById = async (id: number): Promise<StoredWellnessGoal | null> => {
  try {
    const response = await fetch(`${API_BASE}/goals/${id}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to fetch goal');
    }
    const data = await response.json();
    return data.goal || null;
  } catch (error) {
    console.error('Error fetching goal:', error);
    return null;
  }
};

// Create a new goal
export const createGoal = async (goalData: CreateGoalData): Promise<{ success: boolean; goal?: StoredWellnessGoal; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(goalData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to create goal' };
    }
    
    return { success: true, goal: data.goal };
  } catch (error) {
    console.error('Error creating goal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update goal progress
export const updateGoalProgress = async (goalId: number, data: UpdateProgressData): Promise<{ success: boolean; goal?: StoredWellnessGoal; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/goals/${goalId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      return { success: false, error: responseData.error || 'Failed to update goal progress' };
    }
    
    return { success: true, goal: responseData.goal };
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Update goal details
export const updateGoal = async (goalId: number, updates: Partial<StoredWellnessGoal>): Promise<{ success: boolean; goal?: StoredWellnessGoal; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/goals/${goalId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to update goal' };
    }
    
    return { success: true, goal: data.goal };
  } catch (error) {
    console.error('Error updating goal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Delete a goal
export const deleteGoal = async (goalId: number): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_BASE}/goals/${goalId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to delete goal' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting goal:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
};

// Note: Sample goals are now initialized in the server-side database setup
export const initializeSampleGoals = async (): Promise<void> => {
  // This function is kept for compatibility but does nothing
  // Sample data is handled by server initialization
  console.log('Sample goals initialization handled by server');
};

// Get goal statistics for a user
export const getGoalStats = async (userId: number) => {
  const userGoals = await getGoalsByUserId(userId);
  
  return {
    total: userGoals.length,
    active: userGoals.filter(g => !g.isCompleted).length,
    completed: userGoals.filter(g => g.isCompleted).length,
    averageProgress: userGoals.length > 0 
      ? Math.round(userGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / userGoals.length)
      : 0,
    recentlyUpdated: userGoals
      .filter(g => {
        const updated = new Date(g.updatedAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return updated >= weekAgo;
      })
      .length
  };
};

// Note: Data clearing is now handled by the server-side database operations
