// Notification system using SQLite database
// Tracks and notifies students about their wellness score improvements or declines

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

import { Notification } from '@/lib/models/Notification';

const SCORE_CHANGE_THRESHOLD = 10; // Minimum score change to trigger notification
const NOTIFICATION_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Transform database notification to WellnessNotification format
const transformNotificationFromDB = (dbNotification: any): WellnessNotification => {
  return {
    id: dbNotification.id.toString(),
    userId: dbNotification.user_id,
    type: dbNotification.type,
    title: dbNotification.title,
    message: dbNotification.message,
    previousScore: dbNotification.previous_score || 0,
    currentScore: dbNotification.current_score || 0,
    scoreChange: dbNotification.score_change || 0,
    createdAt: dbNotification.created_at,
    read: dbNotification.is_read,
    priority: dbNotification.priority || 'low'
  };
};

// Get all notifications for a user
export const getNotificationsForUser = async (userId: number): Promise<WellnessNotification[]> => {
  try {
    const notifications = await Notification.findByUserId(userId);
    return notifications.map(transformNotificationFromDB);
  } catch (error) {
    console.error('Error reading wellness notifications:', error);
    return [];
  }
};

// Get user's previous wellness state
const getUserWellnessState = async (userId: number): Promise<UserWellnessState | null> => {
  try {
    const state = await Notification.getWellnessState(userId);
    if (!state.lastScore || !state.lastNotificationDate) {
      return null;
    }
    
    return {
      userId,
      lastKnownScore: state.lastScore,
      lastNotificationDate: state.lastNotificationDate,
      totalNotifications: 0 // This would need to be calculated if needed
    };
  } catch (error) {
    console.error('Error reading user wellness state:', error);
    return null;
  }
};

// Note: User wellness state is now tracked through notifications in the database

// Add a new notification
const addNotification = async (notification: Omit<WellnessNotification, 'id' | 'createdAt'>): Promise<WellnessNotification | null> => {
  try {
    const result = await Notification.create({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      previous_score: notification.previousScore,
      current_score: notification.currentScore,
      score_change: notification.scoreChange,
      priority: notification.priority
    });
    
    if (result.success && result.notification) {
      console.log('Added wellness notification:', result.notification);
      return transformNotificationFromDB(result.notification);
    }
    
    return null;
  } catch (error) {
    console.error('Error adding wellness notification:', error);
    return null;
  }
};

// Generate notification content based on score change
const generateNotificationContent = (
  previousScore: number, 
  currentScore: number, 
  scoreChange: number
): { type: WellnessNotification['type'], title: string, message: string, priority: WellnessNotification['priority'] } => {
  const isImprovement = scoreChange > 0;
  const absChange = Math.abs(scoreChange);
  
  // Milestone notifications
  if (currentScore >= 80 && previousScore < 80) {
    return {
      type: 'milestone',
      title: '🎉 Excellent Wellness Achievement!',
      message: `Congratulations! Your wellness score has reached ${currentScore}. You're maintaining excellent mental health!`,
      priority: 'medium'
    };
  }
  
  if (currentScore >= 70 && previousScore < 70) {
    return {
      type: 'milestone',
      title: '✨ Great Progress!',
      message: `Well done! Your wellness score has improved to ${currentScore}. Keep up the great work!`,
      priority: 'medium'
    };
  }
  
  // Alert for significant decline
  if (currentScore < 30) {
    return {
      type: 'alert',
      title: '⚠️ Wellness Check Required',
      message: `Your wellness score has dropped to ${currentScore}. Please consider reaching out to a counselor for support.`,
      priority: 'high'
    };
  }
  
  if (currentScore < 50 && previousScore >= 50) {
    return {
      type: 'alert',
      title: '💙 We\'re Here to Help',
      message: `Your wellness score has decreased to ${currentScore}. Remember, support resources are available if you need them.`,
      priority: 'high'
    };
  }
  
  // General improvements
  if (isImprovement && absChange >= 20) {
    return {
      type: 'improvement',
      title: '🌟 Significant Improvement!',
      message: `Amazing progress! Your wellness score improved by ${absChange} points to ${currentScore}. Keep it up!`,
      priority: 'medium'
    };
  }
  
  if (isImprovement && absChange >= 10) {
    return {
      type: 'improvement',
      title: '📈 Wellness Improving',
      message: `Great news! Your wellness score increased by ${absChange} points to ${currentScore}. You're on the right track!`,
      priority: 'low'
    };
  }
  
  // General declines
  if (!isImprovement && absChange >= 20) {
    return {
      type: 'decline',
      title: '📉 Wellness Score Update',
      message: `Your wellness score has decreased by ${absChange} points to ${currentScore}. Consider using our resources for support.`,
      priority: 'medium'
    };
  }
  
  if (!isImprovement && absChange >= 10) {
    return {
      type: 'decline',
      title: '💭 Checking In',
      message: `Your wellness score changed by ${scoreChange} points to ${currentScore}. Take care of yourself!`,
      priority: 'low'
    };
  }
  
  // Default case
  return {
    type: isImprovement ? 'improvement' : 'decline',
    title: isImprovement ? '📊 Wellness Update' : '📊 Wellness Check',
    message: `Your wellness score is now ${currentScore} (${scoreChange > 0 ? '+' : ''}${scoreChange} points).`,
    priority: 'low'
  };
};

// Check and create notifications for wellness score changes
export const checkWellnessScoreChange = async (userId: number, newScore: number): Promise<WellnessNotification | null> => {
  const userState = await getUserWellnessState(userId);
  
  // First time tracking this user
  if (!userState) {
    // Create welcome notification for new users
    const notification: Omit<WellnessNotification, 'id' | 'createdAt'> = {
      userId,
      type: 'milestone',
      title: '🌟 Welcome to Wellness Tracking!',
      message: `Your initial wellness score is ${newScore}. We'll notify you about important changes to help you stay on track.`,
      previousScore: newScore,
      currentScore: newScore,
      scoreChange: 0,
      read: false,
      priority: 'low'
    };
    
    return await addNotification(notification);
  }
  
  const previousScore = userState.lastKnownScore;
  const scoreChange = newScore - previousScore;
  const absChange = Math.abs(scoreChange);
  
  // Check if enough time has passed since last notification
  const lastNotificationTime = new Date(userState.lastNotificationDate).getTime();
  const now = Date.now();
  const timeSinceLastNotification = now - lastNotificationTime;
  
  // Skip if change is too small or too recent (unless it's a critical alert)
  if (absChange < SCORE_CHANGE_THRESHOLD && newScore >= 30) {
    return null;
  }
  
  if (timeSinceLastNotification < NOTIFICATION_COOLDOWN && newScore >= 50) {
    return null;
  }
  
  // Generate notification content
  const content = generateNotificationContent(previousScore, newScore, scoreChange);
  
  const notification: Omit<WellnessNotification, 'id' | 'createdAt'> = {
    userId,
    ...content,
    previousScore,
    currentScore: newScore,
    scoreChange,
    read: false
  };
  
  const result = await addNotification(notification);
  
  console.log(`Wellness notification created for user ${userId}:`, notification);
  return result;
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const id = parseInt(notificationId);
    if (isNaN(id)) return;
    
    await Notification.markAsRead(id);
    console.log(`Marked notification ${notificationId} as read`);
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId: number): Promise<void> => {
  try {
    await Notification.markAllAsRead(userId);
    console.log(`Marked all notifications as read for user ${userId}`);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// Get unread notifications count
export const getUnreadNotificationCount = async (userId: number): Promise<number> => {
  try {
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};

// Clear old notifications (older than 30 days)
export const clearOldNotifications = async (): Promise<void> => {
  try {
    const result = await Notification.deleteOldNotifications(30);
    if (result.success) {
      console.log(`Cleared ${result.deletedCount} old notifications`);
    }
  } catch (error) {
    console.error('Error clearing old notifications:', error);
  }
};

// Get notifications summary for debugging
export const getNotificationsSummary = async (userId: number) => {
  const notifications = await getNotificationsForUser(userId);
  const userState = await getUserWellnessState(userId);
  
  return {
    totalNotifications: notifications.length,
    unreadCount: notifications.filter(n => !n.read).length,
    lastNotification: notifications.length > 0 ? notifications[notifications.length - 1] : null,
    userState,
    recentNotifications: notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  };
};
