// Notification storage utility
// This manages wellness score change notifications

export interface WellnessNotification {
  id: number;
  userId: number;
  type: 'wellness_score_change' | 'mood_milestone' | 'streak_achievement';
  title: string;
  message: string;
  previousScore?: number;
  newScore: number;
  isRead: boolean;
  createdAt: string;
}

const NOTIFICATIONS_KEY = 'wellness_notifications';
const NOTIFICATION_ID_KEY = 'wellness_notification_next_id';
const PREVIOUS_SCORES_KEY = 'wellness_previous_scores';

// Get next available ID
const getNextId = (): number => {
  if (typeof window === 'undefined') return 1;
  
  const stored = localStorage.getItem(NOTIFICATION_ID_KEY);
  const nextId = stored ? parseInt(stored, 10) + 1 : 1;
  localStorage.setItem(NOTIFICATION_ID_KEY, nextId.toString());
  return nextId;
};

// Get all notifications from localStorage
export const getAllNotifications = (): WellnessNotification[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading notifications from localStorage:', error);
    return [];
  }
};

// Save notifications to localStorage
export const saveAllNotifications = (notifications: WellnessNotification[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Error saving notifications to localStorage:', error);
  }
};

// Get notifications for a specific user
export const getNotificationsForUser = (userId: number, limit?: number): WellnessNotification[] => {
  const allNotifications = getAllNotifications();
  const userNotifications = allNotifications
    .filter(notification => notification.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  return limit ? userNotifications.slice(0, limit) : userNotifications;
};

// Get previous wellness score for user
export const getPreviousWellnessScore = (userId: number): number | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(PREVIOUS_SCORES_KEY);
    const scores = stored ? JSON.parse(stored) : {};
    return scores[userId] || null;
  } catch (error) {
    console.error('Error reading previous scores:', error);
    return null;
  }
};

// Save previous wellness score for user
export const savePreviousWellnessScore = (userId: number, score: number): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(PREVIOUS_SCORES_KEY);
    const scores = stored ? JSON.parse(stored) : {};
    scores[userId] = score;
    localStorage.setItem(PREVIOUS_SCORES_KEY, JSON.stringify(scores));
  } catch (error) {
    console.error('Error saving previous scores:', error);
  }
};

// Create wellness score change notification
export const createWellnessScoreNotification = (
  userId: number,
  newScore: number,
  previousScore: number | null
): WellnessNotification | null => {
  // Don't create notification if score didn't change significantly
  if (previousScore !== null && Math.abs(newScore - previousScore) < 5) {
    return null;
  }
  
  const allNotifications = getAllNotifications();
  
  let title: string;
  let message: string;
  
  if (previousScore === null) {
    title = "Welcome to Wellness Tracking! 🎉";
    message = `Your initial wellness score is ${newScore}/100. Keep tracking your mood to see your progress!`;
  } else {
    const change = newScore - previousScore;
    const isImprovement = change > 0;
    
    if (isImprovement) {
      if (change >= 20) {
        title = "Amazing Progress! 🚀";
        message = `Your wellness score improved by ${change} points to ${newScore}/100! You're doing fantastic!`;
      } else if (change >= 10) {
        title = "Great Improvement! ⭐";
        message = `Your wellness score increased by ${change} points to ${newScore}/100. Keep it up!`;
      } else {
        title = "Nice Progress! 👍";
        message = `Your wellness score improved by ${change} points to ${newScore}/100. Small steps add up!`;
      }
    } else {
      const decline = Math.abs(change);
      if (decline >= 20) {
        title = "Let's Get Back on Track 🤗";
        message = `Your wellness score decreased by ${decline} points to ${newScore}/100. Consider talking to a counselor or trying some self-care activities.`;
      } else if (decline >= 10) {
        title = "Gentle Reminder 💙";
        message = `Your wellness score dropped by ${decline} points to ${newScore}/100. Remember to take care of yourself!`;
      } else {
        title = "Small Dip Noticed 📊";
        message = `Your wellness score decreased by ${decline} points to ${newScore}/100. It's normal to have ups and downs.`;
      }
    }
  }
  
  const notification: WellnessNotification = {
    id: getNextId(),
    userId: userId,
    type: 'wellness_score_change',
    title: title,
    message: message,
    previousScore: previousScore || undefined,
    newScore: newScore,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  
  allNotifications.push(notification);
  saveAllNotifications(allNotifications);
  
  // Save the new score as the previous score for next time
  savePreviousWellnessScore(userId, newScore);
  
  return notification;
};

// Mark notification as read
export const markNotificationAsRead = (notificationId: number): boolean => {
  const allNotifications = getAllNotifications();
  const notificationIndex = allNotifications.findIndex(n => n.id === notificationId);
  
  if (notificationIndex === -1) return false;
  
  allNotifications[notificationIndex].isRead = true;
  saveAllNotifications(allNotifications);
  
  return true;
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = (userId: number): void => {
  const allNotifications = getAllNotifications();
  let hasChanges = false;
  
  allNotifications.forEach(notification => {
    if (notification.userId === userId && !notification.isRead) {
      notification.isRead = true;
      hasChanges = true;
    }
  });
  
  if (hasChanges) {
    saveAllNotifications(allNotifications);
  }
};

// Get unread notification count for user
export const getUnreadNotificationCount = (userId: number): number => {
  const userNotifications = getNotificationsForUser(userId);
  return userNotifications.filter(n => !n.isRead).length;
};
