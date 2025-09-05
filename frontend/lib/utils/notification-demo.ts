// Notification demo utility for testing and demonstrating the notification system
// This helps verify that students receive proper notifications for their activities

import { 
  triggerMoodTrackingNotification,
  triggerGoalCompletionNotification,
  triggerStreakNotification,
  triggerSleepNotification,
  checkAndDisplayRecentNotifications
} from './student-notifications';
import { createNotification } from '@/lib/api/wellness-notifications';
import { toast } from 'react-hot-toast';

// Demo notification scenarios for testing
export const demoNotificationScenarios = async (userId: number) => {
  console.log('🚀 Starting notification demo scenarios...');

  // 1. Mood tracking scenarios
  console.log('📊 Testing mood tracking notifications...');
  
  // Excellent mood
  await triggerMoodTrackingNotification(userId, 'excellent', 75);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Low mood (support message)
  await triggerMoodTrackingNotification(userId, 'low', 80);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Very low mood (urgent support)
  await triggerMoodTrackingNotification(userId, 'very_low', 85);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. Goal completion scenarios
  console.log('🎯 Testing goal completion notifications...');
  
  await triggerGoalCompletionNotification(userId, 'Exercise 3 times this week', 'exercise');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await triggerGoalCompletionNotification(userId, 'Get 8 hours of sleep nightly', 'sleep');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await triggerGoalCompletionNotification(userId, 'Practice mindfulness meditation', 'mindfulness');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 3. Streak notifications
  console.log('🔥 Testing streak notifications...');
  
  await triggerStreakNotification(userId, 'mood tracking', 7);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await triggerStreakNotification(userId, 'exercise', 30);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await triggerStreakNotification(userId, 'meditation', 100);
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 4. Sleep notifications
  console.log('😴 Testing sleep notifications...');
  
  await triggerSleepNotification(userId, 9); // Great sleep
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await triggerSleepNotification(userId, 4); // Poor sleep
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 5. Custom milestone notifications
  console.log('🌟 Testing custom milestone notifications...');
  
  await createNotification({
    type: 'milestone',
    title: '🎓 Academic Achievement!',
    message: 'You\'ve maintained excellent grades while taking care of your mental health. That\'s true balance!',
    priority: 'medium'
  });
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await createNotification({
    type: 'improvement',
    title: '🌱 Personal Growth!',
    message: 'Your consistent self-care routine is paying off. You\'re developing amazing wellness habits!',
    priority: 'low'
  });

  console.log('✅ Notification demo completed!');
  toast.success('Notification demo completed! Check your notifications.');
};

// Quick test functions for specific scenarios
export const testMoodNotifications = async (userId: number) => {
  const moods = ['excellent', 'good', 'neutral', 'low', 'very_low'];
  
  for (let i = 0; i < moods.length; i++) {
    const mood = moods[i];
    const previousScore = 70 - (i * 15); // Declining scores for demo
    
    console.log(`Testing ${mood} mood notification...`);
    await triggerMoodTrackingNotification(userId, mood, previousScore);
    
    if (i < moods.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  toast.success('Mood notification test completed!');
};

export const testGoalNotifications = async (userId: number) => {
  const goals = [
    { title: 'Complete morning workout', type: 'exercise' },
    { title: 'Read for 30 minutes', type: 'personal' },
    { title: 'Practice deep breathing', type: 'mindfulness' },
    { title: 'Call a friend', type: 'social' },
    { title: 'Get 8 hours sleep', type: 'sleep' }
  ];
  
  for (let i = 0; i < goals.length; i++) {
    const goal = goals[i];
    console.log(`Testing ${goal.type} goal completion...`);
    await triggerGoalCompletionNotification(userId, goal.title, goal.type);
    
    if (i < goals.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }
  
  toast.success('Goal notification test completed!');
};

export const testStreakNotifications = async (userId: number) => {
  const streaks = [
    { type: 'mood tracking', count: 3 },
    { type: 'exercise', count: 7 },
    { type: 'meditation', count: 14 },
    { type: 'journaling', count: 30 },
    { type: 'wellness', count: 100 }
  ];
  
  for (let i = 0; i < streaks.length; i++) {
    const streak = streaks[i];
    console.log(`Testing ${streak.count}-day ${streak.type} streak...`);
    await triggerStreakNotification(userId, streak.type, streak.count);
    
    if (i < streaks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  toast.success('Streak notification test completed!');
};

// Wellness milestone notifications
export const createWellnessMilestone = async (type: 'first_week' | 'one_month' | 'consistency' | 'improvement') => {
  let notificationData;
  
  switch (type) {
    case 'first_week':
      notificationData = {
        type: 'milestone' as const,
        title: '🌟 First Week Complete!',
        message: 'Congratulations on completing your first week of wellness tracking! You\'re building great habits.',
        priority: 'medium' as const
      };
      break;
      
    case 'one_month':
      notificationData = {
        type: 'milestone' as const,
        title: '🎉 One Month Achievement!',
        message: 'Amazing! You\'ve been consistently tracking your wellness for a full month. That\'s dedication!',
        priority: 'high' as const
      };
      break;
      
    case 'consistency':
      notificationData = {
        type: 'improvement' as const,
        title: '📈 Consistency Master!',
        message: 'Your consistent wellness tracking is paying off! Keep up this excellent routine.',
        priority: 'medium' as const
      };
      break;
      
    case 'improvement':
      notificationData = {
        type: 'improvement' as const,
        title: '🚀 Wellness Improving!',
        message: 'Your wellness scores show great improvement! You should be proud of your progress.',
        priority: 'medium' as const
      };
      break;
  }
  
  const notification = await createNotification(notificationData);
  
  if (notification) {
    toast.success(notificationData.title, {
      duration: 4000,
      icon: type === 'one_month' ? '🎉' : '🌟'
    });
  }
  
  return notification;
};

// Emergency support notification
export const createSupportNotification = async (urgency: 'low' | 'medium' | 'high') => {
  let notificationData;
  
  switch (urgency) {
    case 'low':
      notificationData = {
        type: 'alert' as const,
        title: '💙 Gentle Check-in',
        message: 'We notice you might be having a challenging time. Remember, it\'s okay to have ups and downs. Self-care is important.',
        priority: 'low' as const
      };
      break;
      
    case 'medium':
      notificationData = {
        type: 'alert' as const,
        title: '🤗 We\'re Here for You',
        message: 'Your recent wellness data shows you might need some support. Consider talking to someone you trust or trying some relaxation techniques.',
        priority: 'medium' as const
      };
      break;
      
    case 'high':
      notificationData = {
        type: 'alert' as const,
        title: '🚨 Support Available Now',
        message: 'We\'re concerned about your wellbeing. Please reach out to a counselor, trusted friend, or mental health professional. You\'re not alone.',
        priority: 'high' as const
      };
      break;
  }
  
  const notification = await createNotification(notificationData);
  
  if (notification) {
    toast.error(notificationData.title, {
      duration: urgency === 'high' ? 8000 : 5000,
      icon: urgency === 'high' ? '🚨' : '💙'
    });
  }
  
  return notification;
};

// Celebration notification for major achievements
export const createCelebrationNotification = async (achievement: string) => {
  const celebrations = [
    '🎉 Outstanding Achievement!',
    '🌟 Incredible Progress!',
    '🚀 You\'re Amazing!',
    '💯 Fantastic Work!',
    '🏆 Wellness Champion!'
  ];
  
  const randomTitle = celebrations[Math.floor(Math.random() * celebrations.length)];
  
  const notificationData = {
    type: 'milestone' as const,
    title: randomTitle,
    message: `${achievement} This is a significant accomplishment and you should be very proud of yourself!`,
    priority: 'high' as const
  };
  
  const notification = await createNotification(notificationData);
  
  if (notification) {
    toast.success(randomTitle, {
      duration: 6000,
      icon: '🎉'
    });
    
    // Show a follow-up celebration
    setTimeout(() => {
      toast.success('Keep up the amazing work!', {
        duration: 3000,
        icon: '💪'
      });
    }, 2000);
  }
  
  return notification;
};
