// Client-safe wellness notifications API wrapper
// This file can be used on both client and server side

import Cookies from 'js-cookie';

export interface WellnessNotification {
  id: string;
  userId: number;
  type: 'improvement' | 'decline' | 'milestone' | 'alert';
  title: string;
  message: string;
  previousScore: number;
  currentScore: number;
  scoreChange: number;
  createdAt: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface UserWellnessState {
  userId: number;
  lastKnownScore: number;
  lastNotificationDate: string;
  totalNotifications: number;
}

export interface CreateNotificationData {
  type: 'improvement' | 'decline' | 'milestone' | 'alert';
  title: string;
  message: string;
  previousScore?: number;
  currentScore?: number;
  scoreChange?: number;
  priority?: 'low' | 'medium' | 'high';
  target_user_id?: number;
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

// Get all notifications for a user
export const getNotificationsForUser = async (userId: number, limit?: number): Promise<WellnessNotification[]> => {
  try {
    const url = limit 
      ? `${API_BASE}/notifications/user/${userId}?limit=${limit}`
      : `${API_BASE}/notifications/user/${userId}`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch notifications');
    }
    
    const data = await response.json();
    
    // Transform to WellnessNotification format
    return data.notifications?.map((notification: any) => ({
      id: notification.id.toString(),
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      previousScore: notification.previous_score || 0,
      currentScore: notification.current_score || 0,
      scoreChange: notification.score_change || 0,
      createdAt: notification.created_at,
      read: notification.is_read,
      priority: notification.priority || 'low'
    })) || [];
  } catch (error) {
    console.error('Error reading wellness notifications:', error);
    return [];
  }
};

// Create a new notification
export const createNotification = async (data: CreateNotificationData): Promise<WellnessNotification | null> => {
  try {
    const response = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create notification');
    }
    
    const result = await response.json();
    
    if (result.notification) {
      return {
        id: result.notification.id.toString(),
        userId: result.notification.user_id,
        type: result.notification.type,
        title: result.notification.title,
        message: result.notification.message,
        previousScore: result.notification.previous_score || 0,
        currentScore: result.notification.current_score || 0,
        scoreChange: result.notification.score_change || 0,
        createdAt: result.notification.created_at,
        read: result.notification.is_read,
        priority: result.notification.priority || 'low'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to mark notification as read:', errorData.error);
      return false;
    }
    
    console.log(`Marked notification ${notificationId} as read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/notifications/user/${userId}`, {
      method: 'PUT',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to mark all notifications as read:', errorData.error);
      return false;
    }
    
    console.log(`Marked all notifications as read for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to delete notification:', errorData.error);
      return false;
    }
    
    console.log(`Deleted notification ${notificationId}`);
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Get unread notifications count
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  try {
    const notifications = await getNotificationsForUser(userId);
    return notifications.filter(n => !n.read).length;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Get notifications summary for debugging
export const getNotificationsSummary = async (userId: number) => {
  try {
    const notifications = await getNotificationsForUser(userId);
    
    return {
      totalNotifications: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      lastNotification: notifications.length > 0 ? notifications[notifications.length - 1] : null,
      userState: null, // This would need to be implemented if needed
      recentNotifications: notifications
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };
  } catch (error) {
    console.error('Error getting notifications summary:', error);
    return {
      totalNotifications: 0,
      unreadCount: 0,
      lastNotification: null,
      userState: null,
      recentNotifications: []
    };
  }
};
