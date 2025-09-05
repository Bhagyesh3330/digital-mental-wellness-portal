// Enhanced notification system for immediate student feedback
// This ensures students get real-time notifications for their activities

import { toast } from 'react-hot-toast';
import { createNotification, CreateNotificationData, getUnreadNotificationCount, getNotificationsForUser } from '@/lib/api/wellness-notifications';
import { calculateWellnessScore } from '@/lib/storage/mood';

// Notification trigger for mood tracking
export const triggerMoodTrackingNotification = async (
  userId: number,
  moodLevel: string,
  previousScore?: number,
  showToast: boolean = true
): Promise<void> => {
  try {
    // Calculate new wellness score
    const currentScore = await calculateWellnessScore(userId);
    
    // Create mood-specific notification
    let notificationData: CreateNotificationData | null = null;
    
    // Immediate feedback based on mood level
    switch (moodLevel) {
      case 'excellent':
        notificationData = {
          type: 'improvement',
          title: '🌟 Feeling Excellent Today!',
          message: `Great to see you're feeling excellent! Your positive mood contributes to your overall wellness. Keep doing what makes you happy!`,
          currentScore,
          previousScore: previousScore || 0,
          scoreChange: previousScore ? currentScore - previousScore : 0,
          priority: 'low'
        };
        break;
        
      case 'good':
        notificationData = {
          type: 'improvement',
          title: '😊 Good Mood Logged!',
          message: `You're having a good day! These positive moments are building blocks for your mental wellness journey.`,
          currentScore,
          previousScore: previousScore || 0,
          scoreChange: previousScore ? currentScore - previousScore : 0,
          priority: 'low'
        };
        break;
        
      case 'neutral':
        notificationData = {
          type: 'milestone',
          title: '📊 Mood Check Completed',
          message: `Thank you for checking in! Neutral days are part of life's natural rhythm. Your consistency in tracking matters.`,
          currentScore,
          previousScore: previousScore || 0,
          scoreChange: previousScore ? currentScore - previousScore : 0,
          priority: 'low'
        };
        break;
        
      case 'low':
        notificationData = {
          type: 'alert',
          title: '💙 We See You',
          message: `It's okay to have challenging days. You took a brave step by logging your mood. Consider some self-care or reach out if you need support.`,
          currentScore,
          previousScore: previousScore || 0,
          scoreChange: previousScore ? currentScore - previousScore : 0,
          priority: 'medium'
        };
        break;
        
      case 'very_low':
        notificationData = {
          type: 'alert',
          title: '🤗 Support is Available',
          message: `We're concerned about you today. Please remember that support is available. Consider talking to a counselor or trusted friend. You're not alone.`,
          currentScore,
          previousScore: previousScore || 0,
          scoreChange: previousScore ? currentScore - previousScore : 0,
          priority: 'high'
        };
        break;
    }
    
    // Create the notification
    if (notificationData) {
      const notification = await createNotification(notificationData);
      
      if (notification && showToast) {
        const moodEmojis = {
          'excellent': '🌟',
          'good': '😊',
          'neutral': '📊',
          'low': '💙',
          'very_low': '🤗'
        };
        
        toast.success(notificationData.title, {
          duration: 4000,
          icon: moodEmojis[moodLevel as keyof typeof moodEmojis] || '📊'
        });
      }
    }
    
    // Check for wellness score milestone notifications
    await checkWellnessScoreMilestones(userId, currentScore, previousScore, showToast);
    
  } catch (error) {
    console.error('Error triggering mood tracking notification:', error);
  }
};

// Check for wellness score milestones and achievements
const checkWellnessScoreMilestones = async (
  userId: number,
  currentScore: number,
  previousScore?: number,
  showToast: boolean = true
): Promise<void> => {
  if (!previousScore) return;
  
  const scoreChange = currentScore - previousScore;
  
  try {
    let milestoneNotification: CreateNotificationData | null = null;
    
    // Major improvements
    if (scoreChange >= 20) {
      milestoneNotification = {
        type: 'milestone',
        title: '🚀 Incredible Progress!',
        message: `Wow! Your wellness score jumped by ${scoreChange} points to ${currentScore}%! This is amazing progress. You should be proud of yourself!`,
        currentScore,
        previousScore,
        scoreChange,
        priority: 'high'
      };
    }
    // Significant improvements
    else if (scoreChange >= 10) {
      milestoneNotification = {
        type: 'improvement',
        title: '📈 Great Improvement!',
        message: `Your wellness score improved by ${scoreChange} points to ${currentScore}%! You're making excellent progress on your wellness journey.`,
        currentScore,
        previousScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Reached high wellness score
    else if (currentScore >= 85 && previousScore < 85) {
      milestoneNotification = {
        type: 'milestone',
        title: '🎉 Outstanding Wellness!',
        message: `Congratulations! Your wellness score has reached ${currentScore}%! You're maintaining exceptional mental health!`,
        currentScore,
        previousScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Reached good wellness score
    else if (currentScore >= 70 && previousScore < 70) {
      milestoneNotification = {
        type: 'milestone',
        title: '⭐ Great Milestone!',
        message: `Well done! Your wellness score has reached ${currentScore}%! You're doing a great job taking care of your mental health.`,
        currentScore,
        previousScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Concerning decline
    else if (scoreChange <= -20) {
      milestoneNotification = {
        type: 'alert',
        title: '💭 Let\'s Check In',
        message: `Your wellness score decreased by ${Math.abs(scoreChange)} points. That's okay - everyone has ups and downs. Consider some self-care or talking to someone you trust.`,
        currentScore,
        previousScore,
        scoreChange,
        priority: 'high'
      };
    }
    
    if (milestoneNotification) {
      const notification = await createNotification(milestoneNotification);
      
      if (notification && showToast) {
        toast.success(milestoneNotification.title, {
          duration: 5000,
          icon: scoreChange > 0 ? '🎉' : '💭'
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking wellness milestones:', error);
  }
};

// Trigger goal completion notification
export const triggerGoalCompletionNotification = async (
  userId: number,
  goalTitle: string,
  goalType: string = 'general',
  showToast: boolean = true
): Promise<void> => {
  try {
    const goalTypeEmojis: Record<string, string> = {
      'sleep': '😴',
      'exercise': '💪',
      'mindfulness': '🧘',
      'social': '🤝',
      'academic': '📚',
      'health': '🏥',
      'personal': '🌱',
      'general': '🎯'
    };
    
    const goalTypeMessages: Record<string, string> = {
      'sleep': 'Better sleep leads to better wellness!',
      'exercise': 'Physical activity is great for your mental health!',
      'mindfulness': 'Taking time for mental wellness is so important!',
      'social': 'Connecting with others supports your mental health!',
      'academic': 'Academic achievements boost your confidence!',
      'health': 'Taking care of your health is taking care of your mind!',
      'personal': 'Personal growth contributes to your wellbeing!',
      'general': 'Every step forward counts!'
    };
    
    const emoji = goalTypeEmojis[goalType] || '🎯';
    const typeMessage = goalTypeMessages[goalType] || 'Every step forward counts!';
    
    const notificationData: CreateNotificationData = {
      type: 'milestone',
      title: `${emoji} Goal Achieved!`,
      message: `Congratulations! You've completed your goal: "${goalTitle}". ${typeMessage}`,
      priority: 'medium'
    };
    
    const notification = await createNotification(notificationData);
    
    if (notification && showToast) {
      toast.success(`${emoji} Goal Completed!`, {
        duration: 5000,
        icon: emoji
      });
      
      // Show a celebratory second toast
      setTimeout(() => {
        toast.success(`"${goalTitle}" - Well done!`, {
          duration: 4000,
          icon: '🎉'
        });
      }, 1000);
    }
    
  } catch (error) {
    console.error('Error triggering goal completion notification:', error);
  }
};

// Trigger streak achievement notification
export const triggerStreakNotification = async (
  userId: number,
  streakType: string,
  streakCount: number,
  showToast: boolean = true
): Promise<void> => {
  try {
    // Only notify on meaningful streaks
    if (![3, 7, 14, 21, 30, 60, 100].includes(streakCount)) return;
    
    let title: string;
    let message: string;
    let priority: 'low' | 'medium' | 'high' = 'low';
    let emoji: string;
    
    const activityName = streakType === 'mood' ? 'mood tracking' : streakType;
    
    if (streakCount >= 100) {
      title = '💯 Legendary Streak!';
      message = `Incredible! ${streakCount} days of consistent ${activityName}! You're a wellness champion!`;
      priority = 'high';
      emoji = '💯';
    } else if (streakCount >= 60) {
      title = '🏆 Amazing Dedication!';
      message = `Outstanding! ${streakCount} days of ${activityName}. Your commitment is inspiring!`;
      priority = 'medium';
      emoji = '🏆';
    } else if (streakCount >= 30) {
      title = '🔥 One Month Strong!';
      message = `Fantastic! You've maintained ${activityName} for a full month! That's building real habits!`;
      priority = 'medium';
      emoji = '🔥';
    } else if (streakCount >= 21) {
      title = '⚡ Three Week Streak!';
      message = `Excellent! ${streakCount} days of ${activityName}. You're really building momentum!`;
      priority = 'low';
      emoji = '⚡';
    } else if (streakCount >= 14) {
      title = '🌟 Two Week Achievement!';
      message = `Great work! ${streakCount} days of consistent ${activityName}. You're developing great habits!`;
      priority = 'low';
      emoji = '🌟';
    } else if (streakCount >= 7) {
      title = '🎯 One Week Strong!';
      message = `Awesome! You've maintained ${activityName} for a full week! Keep the momentum going!`;
      priority = 'low';
      emoji = '🎯';
    } else if (streakCount >= 3) {
      title = '🌱 Building Habits!';
      message = `Nice! ${streakCount} days of ${activityName}. You're developing a healthy routine!`;
      priority = 'low';
      emoji = '🌱';
    } else {
      return;
    }
    
    const notificationData: CreateNotificationData = {
      type: 'milestone',
      title,
      message,
      priority
    };
    
    const notification = await createNotification(notificationData);
    
    if (notification && showToast) {
      toast.success(title, {
        duration: 4000,
        icon: emoji
      });
    }
    
  } catch (error) {
    console.error('Error triggering streak notification:', error);
  }
};

// Check and display recent notifications to student
export const checkAndDisplayRecentNotifications = async (
  userId: number,
  showToast: boolean = true
): Promise<void> => {
  try {
    const unreadCount = await getUnreadNotificationCount(userId);
    
    if (unreadCount > 0) {
      const recentNotifications = await getNotificationsForUser(userId, 5);
      const unreadNotifications = recentNotifications
        .filter(n => !n.read)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (unreadNotifications.length > 0 && showToast) {
        const latest = unreadNotifications[0];
        const typeEmojis: Record<string, string> = {
          'improvement': '📈',
          'milestone': '🎉',
          'alert': '💙',
          'decline': '📉'
        };
        
        toast.success(latest.title, {
          duration: 5000,
          icon: typeEmojis[latest.type] || '🔔'
        });
        
        // If there are multiple unread, show a summary
        if (unreadNotifications.length > 1) {
          setTimeout(() => {
            toast.success(`You have ${unreadCount} wellness updates!`, {
              duration: 3000,
              icon: '🔔'
            });
          }, 2000);
        }
      }
    }
  } catch (error) {
    console.error('Error checking recent notifications:', error);
  }
};

// Import the new motivation function
import { triggerMotivationAnimation } from './appreciation-notifications';

// Trigger sleep quality notification
export const triggerSleepNotification = async (
  userId: number,
  sleepHours: number,
  sleepQuality?: number,
  showToast: boolean = true
): Promise<void> => {
  try {
    let notificationData: CreateNotificationData | null = null;
    
    if (sleepHours >= 9) {
      notificationData = {
        type: 'improvement',
        title: '😴 Great Sleep!',
        message: `You got ${sleepHours} hours of sleep! Well-rested minds are happier minds. Keep up the good sleep hygiene!`,
        priority: 'low'
      };
    } else if (sleepHours >= 7) {
      notificationData = {
        type: 'improvement',
        title: '✨ Good Rest!',
        message: `${sleepHours} hours of sleep logged! You're taking good care of your sleep needs.`,
        priority: 'low'
      };
    } else if (sleepHours < 5) {
      // Trigger motivation animation for very poor sleep
      await triggerMotivationAnimation(userId, 'poor_sleep', `Only ${sleepHours} hours of sleep`, showToast);
      return;
    } else if (sleepHours < 7) {
      // Trigger motivation animation for suboptimal sleep
      await triggerMotivationAnimation(userId, 'poor_sleep', `${sleepHours} hours of sleep`, showToast);
      return;
    }
    
    if (notificationData) {
      const notification = await createNotification(notificationData);
      
      if (notification && showToast) {
        toast.success(notificationData.title, {
          duration: 3000,
          icon: '😴'
        });
      }
    }
  } catch (error) {
    console.error('Error triggering sleep notification:', error);
  }
};
