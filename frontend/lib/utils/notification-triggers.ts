// Notification triggers for automatic notification creation
// This module handles creating notifications based on user activities

import { createNotification, CreateNotificationData } from '@/lib/api/wellness-notifications';
import { calculateWellnessScore } from '@/lib/storage/mood';

export interface MoodChangeData {
  userId: number;
  previousScore?: number;
  currentScore: number;
  moodLevel: string;
  energyLevel: number;
  sleepHours: number;
  stressLevel: number;
}

export interface GoalCompletionData {
  userId: number;
  goalTitle: string;
  goalType: string;
  completionDate: string;
}

// Create notification for wellness score changes
export const createWellnessScoreNotification = async (data: MoodChangeData): Promise<boolean> => {
  try {
    const { userId, previousScore, currentScore, moodLevel } = data;

    // Don't create notifications for minor changes
    if (previousScore && Math.abs(currentScore - previousScore) < 5) {
      return false;
    }

    const scoreChange = previousScore ? currentScore - previousScore : 0;
    let notificationData: CreateNotificationData;

    // Welcome notification for first-time users
    if (!previousScore) {
      notificationData = {
        type: 'milestone',
        title: '🌟 Welcome to Wellness Tracking!',
        message: `Your initial wellness score is ${currentScore}%. We'll help you track your mental health journey and notify you of important changes.`,
        previousScore: 0,
        currentScore,
        scoreChange: 0,
        priority: 'low'
      };
    }
    // Significant improvement
    else if (scoreChange >= 15) {
      notificationData = {
        type: 'improvement',
        title: '🚀 Amazing Progress!',
        message: `Your wellness score improved by ${scoreChange} points to ${currentScore}%! You're doing fantastic. Keep up the great work!`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Moderate improvement
    else if (scoreChange >= 8) {
      notificationData = {
        type: 'improvement',
        title: '📈 Great Improvement!',
        message: `Your wellness score increased by ${scoreChange} points to ${currentScore}%. Small steps lead to big changes!`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'low'
      };
    }
    // Milestone achievements
    else if (currentScore >= 80 && (previousScore < 80)) {
      notificationData = {
        type: 'milestone',
        title: '🎉 Excellent Wellness Achievement!',
        message: `Congratulations! Your wellness score has reached ${currentScore}%. You're maintaining excellent mental health!`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'medium'
      };
    }
    else if (currentScore >= 70 && (previousScore < 70)) {
      notificationData = {
        type: 'milestone',
        title: '✨ Great Milestone Reached!',
        message: `Well done! Your wellness score has improved to ${currentScore}%. You're on a great track!`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Alert for low scores
    else if (currentScore < 30) {
      notificationData = {
        type: 'alert',
        title: '💙 We\'re Here to Support You',
        message: `Your wellness score is ${currentScore}%. Remember, it's okay to have difficult days. Consider reaching out to a counselor for support.`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'high'
      };
    }
    else if (currentScore < 50 && (previousScore >= 50)) {
      notificationData = {
        type: 'alert',
        title: '🤗 Wellness Check-In',
        message: `Your wellness score has decreased to ${currentScore}%. Take some time for self-care today. Support resources are available if needed.`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Significant decline
    else if (scoreChange <= -15) {
      notificationData = {
        type: 'decline',
        title: '📉 Let\'s Focus on Self-Care',
        message: `Your wellness score decreased by ${Math.abs(scoreChange)} points to ${currentScore}%. Consider some relaxation techniques or speaking with someone you trust.`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'medium'
      };
    }
    // Moderate decline
    else if (scoreChange <= -8) {
      notificationData = {
        type: 'decline',
        title: '💭 Wellness Update',
        message: `Your wellness score changed by ${scoreChange} points to ${currentScore}%. It's normal to have ups and downs. Take care of yourself!`,
        previousScore,
        currentScore,
        scoreChange,
        priority: 'low'
      };
    }
    else {
      // No significant change, skip notification
      return false;
    }

    const notification = await createNotification(notificationData);
    return !!notification;
  } catch (error) {
    console.error('Error creating wellness score notification:', error);
    return false;
  }
};

// Create notification for goal completion
export const createGoalCompletionNotification = async (data: GoalCompletionData): Promise<boolean> => {
  try {
    const { userId, goalTitle, goalType } = data;

    let notificationData: CreateNotificationData;

    // Customize notification based on goal type
    if (goalType === 'sleep') {
      notificationData = {
        type: 'milestone',
        title: '😴 Sleep Goal Achieved!',
        message: `Congratulations! You've completed your sleep goal: "${goalTitle}". Better sleep leads to better wellness!`,
        priority: 'medium'
      };
    } else if (goalType === 'exercise') {
      notificationData = {
        type: 'milestone',
        title: '💪 Exercise Goal Completed!',
        message: `Great job! You've achieved your exercise goal: "${goalTitle}". Physical activity is great for your mental health!`,
        priority: 'medium'
      };
    } else if (goalType === 'mindfulness') {
      notificationData = {
        type: 'milestone',
        title: '🧘 Mindfulness Goal Achieved!',
        message: `Well done! You've completed your mindfulness goal: "${goalTitle}". Taking time for mental wellness is so important!`,
        priority: 'medium'
      };
    } else if (goalType === 'social') {
      notificationData = {
        type: 'milestone',
        title: '🤝 Social Goal Accomplished!',
        message: `Awesome! You've achieved your social goal: "${goalTitle}". Connecting with others supports your mental health!`,
        priority: 'medium'
      };
    } else {
      notificationData = {
        type: 'milestone',
        title: '🎯 Goal Achieved!',
        message: `Congratulations! You've completed your goal: "${goalTitle}". Every step forward counts!`,
        priority: 'medium'
      };
    }

    const notification = await createNotification(notificationData);
    return !!notification;
  } catch (error) {
    console.error('Error creating goal completion notification:', error);
    return false;
  }
};

// Create streak achievement notifications
export const createStreakNotification = async (userId: number, streakType: string, streakCount: number): Promise<boolean> => {
  try {
    // Only notify on significant streaks
    if (![3, 7, 14, 30, 50, 100].includes(streakCount)) {
      return false;
    }

    let notificationData: CreateNotificationData;

    const streakLabel = streakType === 'mood' ? 'mood tracking' : streakType;

    if (streakCount >= 100) {
      notificationData = {
        type: 'milestone',
        title: '💯 Incredible Streak!',
        message: `Amazing! You've maintained your ${streakLabel} streak for ${streakCount} days! You're truly dedicated to your wellness journey.`,
        priority: 'high'
      };
    } else if (streakCount >= 30) {
      notificationData = {
        type: 'milestone',
        title: '🏆 Monthly Achievement!',
        message: `Outstanding! ${streakCount} days of consistent ${streakLabel}. You're building amazing wellness habits!`,
        priority: 'medium'
      };
    } else if (streakCount >= 14) {
      notificationData = {
        type: 'milestone',
        title: '🔥 Two Week Streak!',
        message: `Excellent work! You've been consistent with ${streakLabel} for ${streakCount} days. Keep the momentum going!`,
        priority: 'medium'
      };
    } else if (streakCount >= 7) {
      notificationData = {
        type: 'milestone',
        title: '⭐ One Week Strong!',
        message: `Great job! You've maintained your ${streakLabel} streak for a full week. Consistency is key to wellness!`,
        priority: 'low'
      };
    } else if (streakCount >= 3) {
      notificationData = {
        type: 'improvement',
        title: '🌱 Building Good Habits!',
        message: `Nice work! ${streakCount} days of ${streakLabel}. You're developing a healthy routine!`,
        priority: 'low'
      };
    } else {
      return false;
    }

    const notification = await createNotification(notificationData);
    return !!notification;
  } catch (error) {
    console.error('Error creating streak notification:', error);
    return false;
  }
};

// Create mood pattern notifications
export const createMoodPatternNotification = async (userId: number, pattern: string, details: string): Promise<boolean> => {
  try {
    let notificationData: CreateNotificationData;

    switch (pattern) {
      case 'consistent_high':
        notificationData = {
          type: 'improvement',
          title: '😊 Sustained Positivity!',
          message: `We've noticed you've been consistently feeling great! ${details}. Keep up whatever you're doing!`,
          priority: 'low'
        };
        break;
      case 'improving_trend':
        notificationData = {
          type: 'improvement',
          title: '📈 Positive Trend Detected!',
          message: `Your mood has been steadily improving over time. ${details}. You're making great progress!`,
          priority: 'low'
        };
        break;
      case 'declining_trend':
        notificationData = {
          type: 'alert',
          title: '💭 Wellness Check Needed',
          message: `We've noticed your mood has been declining recently. ${details}. Consider some self-care or reaching out for support.`,
          priority: 'medium'
        };
        break;
      case 'volatile':
        notificationData = {
          type: 'alert',
          title: '🎭 Mood Swings Noticed',
          message: `Your mood has been quite variable lately. ${details}. If this continues, consider talking to a counselor.`,
          priority: 'medium'
        };
        break;
      default:
        return false;
    }

    const notification = await createNotification(notificationData);
    return !!notification;
  } catch (error) {
    console.error('Error creating mood pattern notification:', error);
    return false;
  }
};

// Helper function to determine if notifications should be created based on time
export const shouldCreateNotification = (lastNotificationTime?: string): boolean => {
  if (!lastNotificationTime) return true;

  const now = new Date();
  const lastTime = new Date(lastNotificationTime);
  const hoursSinceLastNotification = (now.getTime() - lastTime.getTime()) / (1000 * 60 * 60);

  // Don't spam notifications - wait at least 4 hours between notifications
  return hoursSinceLastNotification >= 4;
};
