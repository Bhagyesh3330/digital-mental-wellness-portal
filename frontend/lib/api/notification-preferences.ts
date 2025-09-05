// Notification preferences API client
import Cookies from 'js-cookie';

export interface NotificationPreferences {
  id?: number;
  userId: number;
  enableWellnessScoreNotifications: boolean;
  enableGoalCompletionNotifications: boolean;
  enableStreakNotifications: boolean;
  enableMoodPatternNotifications: boolean;
  enableDailyReminders: boolean;
  reminderTime: string; // HH:MM format
  emailNotifications: boolean;
  pushNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  minScoreChangeThreshold: number;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// API endpoint base
const API_BASE = '/api';

// Get authentication headers
const getAuthHeaders = (): HeadersInit => {
  const token = Cookies.get('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Get user's notification preferences
export const getNotificationPreferences = async (): Promise<ApiResponse<NotificationPreferences>> => {
  try {
    const response = await fetch(`${API_BASE}/notification-preferences`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch notification preferences');
    }

    const data = await response.json();
    return {
      success: true,
      data: data.preferences
    };
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch notification preferences'
    };
  }
};

// Update user's notification preferences
export const updateNotificationPreferences = async (
  updates: Partial<NotificationPreferences>
): Promise<ApiResponse<NotificationPreferences>> => {
  try {
    const response = await fetch(`${API_BASE}/notification-preferences`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update notification preferences');
    }

    const data = await response.json();
    return {
      success: true,
      data: data.preferences,
      message: data.message
    };
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update notification preferences'
    };
  }
};

// Check if notifications should be sent based on preferences and quiet hours
export const shouldSendNotification = (
  preferences: NotificationPreferences,
  notificationType: 'wellness_score' | 'goal_completion' | 'streak' | 'mood_pattern'
): boolean => {
  // Check if notification type is enabled
  switch (notificationType) {
    case 'wellness_score':
      if (!preferences.enableWellnessScoreNotifications) return false;
      break;
    case 'goal_completion':
      if (!preferences.enableGoalCompletionNotifications) return false;
      break;
    case 'streak':
      if (!preferences.enableStreakNotifications) return false;
      break;
    case 'mood_pattern':
      if (!preferences.enableMoodPatternNotifications) return false;
      break;
  }

  // Check quiet hours
  if (preferences.quietHours.enabled) {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const { startTime, endTime } = preferences.quietHours;
    
    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime <= endTime) {
        return false; // In quiet hours
      }
    } else {
      if (currentTime >= startTime && currentTime <= endTime) {
        return false; // In quiet hours
      }
    }
  }

  return true;
};

// Get default notification preferences
export const getDefaultNotificationPreferences = (userId: number): NotificationPreferences => {
  return {
    userId,
    enableWellnessScoreNotifications: true,
    enableGoalCompletionNotifications: true,
    enableStreakNotifications: true,
    enableMoodPatternNotifications: true,
    enableDailyReminders: false,
    reminderTime: '20:00',
    emailNotifications: false,
    pushNotifications: true,
    frequency: 'immediate',
    minScoreChangeThreshold: 5,
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00'
    }
  };
};
