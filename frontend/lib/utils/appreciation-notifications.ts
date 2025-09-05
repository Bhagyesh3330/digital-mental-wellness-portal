// Comprehensive appreciation and motivation notification system
// This provides positive reinforcement for student achievements

import { toast } from 'react-hot-toast';
import { createNotification, CreateNotificationData } from '@/lib/api/wellness-notifications';

// Achievement types with their corresponding celebration levels
export type AchievementType = 'goal_completion' | 'mood_streak' | 'session_completion' | 'wellness_milestone' | 'consistency_reward';

export interface AppreciationMessageTemplate {
  title: string;
  message: string;
  emoji: string;
  celebrationLevel: 'small' | 'medium' | 'big' | 'epic';
  priority: 'low' | 'medium' | 'high';
}

// Goal completion appreciation messages
const GOAL_COMPLETION_MESSAGES: Record<string, AppreciationMessageTemplate[]> = {
  sleep: [
    {
      title: "😴 Sweet Dreams Achievement!",
      message: "You've mastered your sleep goal! Better rest means a happier, healthier you. Your mind and body are thanking you right now! 🌙",
      emoji: "😴",
      celebrationLevel: "medium",
      priority: "medium"
    },
    {
      title: "🌟 Sleep Champion!",
      message: "Goal completed! You're building incredible sleep habits. Quality rest is your superpower for mental wellness! ✨",
      emoji: "🌟",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  exercise: [
    {
      title: "💪 Fitness Victory!",
      message: "You crushed your exercise goal! Your body is stronger and your mind is clearer. You're absolutely unstoppable! 🏃‍♂️",
      emoji: "💪",
      celebrationLevel: "big",
      priority: "medium"
    },
    {
      title: "🏆 Movement Master!",
      message: "Goal achieved! Every workout is an investment in your mental health. You're building resilience inside and out! 💯",
      emoji: "🏆",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  mindfulness: [
    {
      title: "🧘‍♀️ Zen Achievement Unlocked!",
      message: "Mindfulness goal complete! You've given yourself the gift of presence and peace. Your inner calm is growing stronger! 🌸",
      emoji: "🧘‍♀️",
      celebrationLevel: "medium",
      priority: "medium"
    },
    {
      title: "✨ Mindful Warrior!",
      message: "Incredible! You've mastered your mindfulness goal. These moments of awareness are building your emotional intelligence! 🌟",
      emoji: "✨",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  social: [
    {
      title: "🤝 Connection Champion!",
      message: "Social goal achieved! You've nurtured relationships that nurture your soul. Connection is medicine for the mind! 💕",
      emoji: "🤝",
      celebrationLevel: "medium",
      priority: "medium"
    },
    {
      title: "🌈 Social Butterfly Success!",
      message: "You did it! Building meaningful connections strengthens your support network. You're creating a circle of wellness! 🦋",
      emoji: "🌈",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  academic: [
    {
      title: "📚 Academic Achiever!",
      message: "Learning goal completed! Every bit of knowledge you gain builds confidence and opens new possibilities. You're unstoppable! 🎓",
      emoji: "📚",
      celebrationLevel: "big",
      priority: "medium"
    },
    {
      title: "🎯 Study Success!",
      message: "Goal mastered! Academic achievements boost your self-esteem and future prospects. You're investing in yourself! ⭐",
      emoji: "🎯",
      celebrationLevel: "medium",
      priority: "medium"
    }
  ],
  health: [
    {
      title: "🏥 Health Hero!",
      message: "Health goal achieved! Taking care of your body is taking care of your mind. You're your own best healthcare advocate! 💊",
      emoji: "🏥",
      celebrationLevel: "medium",
      priority: "medium"
    },
    {
      title: "💚 Wellness Warrior!",
      message: "Fantastic! You've prioritized your health, and it shows in everything you do. Healthy habits create a happy life! 🌱",
      emoji: "💚",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  general: [
    {
      title: "🎉 Goal Crusher!",
      message: "Another goal down! You're proving to yourself that you can achieve anything you set your mind to. Keep soaring! 🚀",
      emoji: "🎉",
      celebrationLevel: "big",
      priority: "medium"
    },
    {
      title: "⭐ Dream Achiever!",
      message: "Goal completed with style! Every achievement builds momentum for the next. You're writing your own success story! 📖",
      emoji: "⭐",
      celebrationLevel: "medium",
      priority: "medium"
    }
  ]
};

// Mood tracking streak appreciation messages
const MOOD_STREAK_MESSAGES: Record<number, AppreciationMessageTemplate[]> = {
  3: [
    {
      title: "🌱 Consistency Sprout!",
      message: "3 days of mood tracking! You're planting seeds of self-awareness. Small steps lead to big transformations! 🌿",
      emoji: "🌱",
      celebrationLevel: "small",
      priority: "low"
    }
  ],
  7: [
    {
      title: "🎯 One Week Wonder!",
      message: "A full week of mood tracking! You're building incredible self-awareness habits. Your emotional intelligence is growing! 🧠",
      emoji: "🎯",
      celebrationLevel: "medium",
      priority: "medium"
    },
    {
      title: "⭐ Week One Champion!",
      message: "7 days strong! You're becoming your own mental health expert. This consistency is your superpower! 💪",
      emoji: "⭐",
      celebrationLevel: "medium",
      priority: "medium"
    }
  ],
  14: [
    {
      title: "🔥 Two Week Streak Master!",
      message: "14 days of dedication! You've officially built a habit. Your commitment to wellness is truly inspiring! 🌟",
      emoji: "🔥",
      celebrationLevel: "big",
      priority: "medium"
    }
  ],
  30: [
    {
      title: "🏆 Monthly Milestone Legend!",
      message: "30 days of mood tracking! You've unlocked the power of consistent self-reflection. You're a wellness champion! 👑",
      emoji: "🏆",
      celebrationLevel: "epic",
      priority: "high"
    }
  ],
  60: [
    {
      title: "💎 Diamond Streak Achieved!",
      message: "60 days! Your dedication is diamond-level. You've mastered the art of self-awareness. Nothing can stop you now! 💫",
      emoji: "💎",
      celebrationLevel: "epic",
      priority: "high"
    }
  ],
  100: [
    {
      title: "💯 Legendary Status Unlocked!",
      message: "100 DAYS! You're a wellness legend! Your consistency has transformed your self-awareness into a superpower! 🦸‍♀️",
      emoji: "💯",
      celebrationLevel: "epic",
      priority: "high"
    }
  ]
};

// Session completion appreciation messages
const SESSION_COMPLETION_MESSAGES: AppreciationMessageTemplate[] = [
  {
    title: "🌟 Brave Step Forward!",
    message: "Session completed! It takes courage to invest in your mental health. You're building resilience and strength with every conversation! 💪",
    emoji: "🌟",
    celebrationLevel: "big",
    priority: "medium"
  },
  {
    title: "🗣️ Communication Champion!",
    message: "Another session done! You're actively working on yourself, and that's incredibly admirable. Growth happens in these moments! 🌱",
    emoji: "🗣️",
    celebrationLevel: "medium",
    priority: "medium"
  },
  {
    title: "💙 Self-Care Superstar!",
    message: "Session complete! You prioritized your mental wellness today. Every session is an investment in a happier, healthier you! ✨",
    emoji: "💙",
    celebrationLevel: "big",
    priority: "medium"
  },
  {
    title: "🎯 Progress in Motion!",
    message: "Great work in your session! You're taking active steps toward your goals. Your commitment to growth is inspiring! 🚀",
    emoji: "🎯",
    celebrationLevel: "medium",
    priority: "medium"
  },
  {
    title: "🌈 Healing Journey Continues!",
    message: "Session accomplished! You're writing your own recovery story. Each conversation brings new insights and possibilities! 📝",
    emoji: "🌈",
    celebrationLevel: "big",
    priority: "medium"
  }
];

// Motivational messages for when students need encouragement
const MOTIVATION_MESSAGES: Record<string, AppreciationMessageTemplate[]> = {
  goal_missed: [
    {
      title: "🌱 Tomorrow's a Fresh Start!",
      message: "Didn't complete your goal today? That's perfectly okay! Every wellness journey has ups and downs. What matters is that you care and you're trying! 💪",
      emoji: "🌱",
      celebrationLevel: "small",
      priority: "medium"
    },
    {
      title: "💙 Progress, Not Perfection!",
      message: "Remember, wellness isn't about being perfect - it's about showing up for yourself. Every small effort counts, and you're already on the right path! ✨",
      emoji: "💙",
      celebrationLevel: "small",
      priority: "medium"
    },
    {
      title: "🤗 Be Kind to Yourself!",
      message: "You're human, and that's beautiful! Missed goals are just learning opportunities. Your commitment to wellness is what truly matters! 🌟",
      emoji: "🤗",
      celebrationLevel: "small",
      priority: "medium"
    }
  ],
  low_mood: [
    {
      title: "🌈 You're Not Alone!",
      message: "Feeling low today? That's okay - your feelings are valid. Thank you for being honest with yourself. Brighter days are ahead! 💝",
      emoji: "🌈",
      celebrationLevel: "small",
      priority: "medium"
    },
    {
      title: "💪 Your Strength Shows!",
      message: "Even on tough days, you're still checking in with yourself. That's real courage! Every small step toward wellness matters! 🌱",
      emoji: "💪",
      celebrationLevel: "small",
      priority: "medium"
    },
    {
      title: "🤲 Tomorrow Holds Hope!",
      message: "Difficult days don't last, but resilient people like you do. You're building emotional awareness - that's incredibly valuable! 🌅",
      emoji: "🤲",
      celebrationLevel: "small",
      priority: "medium"
    }
  ],
  poor_sleep: [
    {
      title: "😴 Rest is Self-Care!",
      message: "Didn't get enough sleep? Your body and mind are asking for what they need. Let's make tonight a priority for better rest! 🌙",
      emoji: "😴",
      celebrationLevel: "small",
      priority: "medium"
    },
    {
      title: "💤 Sleep Matters!",
      message: "Quality sleep is the foundation of mental wellness. Even acknowledging your sleep needs shows you care about your health! ⭐",
      emoji: "💤",
      celebrationLevel: "small",
      priority: "medium"
    }
  ]
};

// Special milestone messages for multiple achievements
const MILESTONE_COMBO_MESSAGES: AppreciationMessageTemplate[] = [
  {
    title: "🎊 Multi-Achievement Superstar!",
    message: "Wow! You're crushing multiple goals AND staying consistent! You're becoming the wellness champion you were meant to be! 🏆",
    emoji: "🎊",
    celebrationLevel: "epic",
    priority: "high"
  },
  {
    title: "🌟 Wellness All-Star!",
    message: "Look at you go! Multiple achievements unlocked. You're proving that small, consistent actions create extraordinary results! 💫",
    emoji: "🌟",
    celebrationLevel: "epic",
    priority: "high"
  }
];

// Helper function to get random message from array
const getRandomMessage = (messages: AppreciationMessageTemplate[]): AppreciationMessageTemplate => {
  return messages[Math.floor(Math.random() * messages.length)];
};

// Function to trigger motivation animation for struggling scenarios
export const triggerMotivationAnimation = async (
  userId: number,
  motivationType: 'goal_missed' | 'low_mood' | 'poor_sleep',
  context: string = '',
  showToast: boolean = true,
  showAnimation: boolean = true
): Promise<void> => {
  try {
    const messages = MOTIVATION_MESSAGES[motivationType] || [];
    if (messages.length === 0) return;
    
    const template = getRandomMessage(messages);
    
    const contextMessage = context ? `\n\n💬 Context: "${context}"` : '';
    const motivationalMessage = `${template.message}${contextMessage}

💝 Remember: You're stronger than you know, and every day is a chance to start fresh. We believe in you!`;

    const notificationData: CreateNotificationData = {
      type: 'alert',
      title: template.title,
      message: motivationalMessage,
      priority: template.priority
    };

    const notification = await createNotification(notificationData);

    if (showToast && notification) {
      toast.success(template.title, {
        duration: 6000,
        icon: template.emoji,
        style: {
          background: 'linear-gradient(45deg, #fbbf24, #f59e0b, #d97706)',
          color: '#fff',
          border: '2px solid #fcd34d',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600'
        }
      });

      // Follow-up encouragement message
      setTimeout(() => {
        toast.success('You\'ve got this! 💪', {
          duration: 3000,
          icon: '🌱',
          style: {
            background: '#10b981',
            color: '#fff',
            border: '2px solid #34d399',
            borderRadius: '12px'
          }
        });
      }, 2000);
    }

    if (showAnimation) {
      triggerCelebrationAnimation('motivation');
    }

  } catch (error) {
    console.error('Error triggering motivation animation:', error);
  }
};

// Main function to trigger goal completion appreciation
export const triggerGoalCompletionAppreciation = async (
  userId: number,
  goalTitle: string,
  goalType: string = 'general',
  isCompleted: boolean = true,
  showToast: boolean = true,
  celebrateWithAnimation: boolean = true
): Promise<void> => {
  try {
    // If goal was not completed, trigger motivation instead
    if (!isCompleted) {
      await triggerMotivationAnimation(userId, 'goal_missed', goalTitle, showToast, celebrateWithAnimation);
      return;
    }
    
    // Continue with normal celebration for completed goals
    const messages = GOAL_COMPLETION_MESSAGES[goalType] || GOAL_COMPLETION_MESSAGES.general;
    const template = getRandomMessage(messages);
    
    // Personalize the message with the goal title
    const personalizedMessage = `${template.message}

🎯 Goal: "${goalTitle}"

You're building momentum towards a healthier, happier you! What's your next wellness adventure going to be? 🚀`;

    const notificationData: CreateNotificationData = {
      type: 'milestone',
      title: template.title,
      message: personalizedMessage,
      priority: template.priority
    };

    // Create database notification
    const notification = await createNotification(notificationData);

    if (showToast && notification) {
      // Main celebration toast
      toast.success(template.title, {
        duration: 5000,
        icon: template.emoji,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '2px solid #10b981',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600'
        }
      });

      // Delayed personalized message
      setTimeout(() => {
        toast.success(`"${goalTitle}" - COMPLETED! 🎉`, {
          duration: 4000,
          icon: '🏆',
          style: {
            background: '#059669',
            color: '#fff',
            border: '2px solid #34d399',
            borderRadius: '12px'
          }
        });
      }, 1500);

      // Epic celebration for big achievements
      if (template.celebrationLevel === 'epic' || template.celebrationLevel === 'big') {
        setTimeout(() => {
          toast.success('You are AMAZING! Keep up the incredible work! 🌟', {
            duration: 3000,
            icon: '💫',
            style: {
              background: 'linear-gradient(45deg, #f59e0b, #d97706)',
              color: '#fff',
              border: '2px solid #fbbf24',
              borderRadius: '12px'
            }
          });
        }, 3000);
      }
    }

    // Trigger confetti or celebration animation if enabled
    if (celebrateWithAnimation && template.celebrationLevel === 'epic') {
      triggerCelebrationAnimation('confetti');
    } else if (celebrateWithAnimation && template.celebrationLevel === 'big') {
      triggerCelebrationAnimation('sparkles');
    }

  } catch (error) {
    console.error('Error triggering goal completion appreciation:', error);
  }
};

// Function to trigger mood tracking appreciation
export const triggerMoodTrackingAppreciation = async (
  userId: number,
  moodLevel: string,
  streakCount: number,
  showToast: boolean = true
): Promise<void> => {
  try {
    // Check for streak milestones
    if (MOOD_STREAK_MESSAGES[streakCount]) {
      const messages = MOOD_STREAK_MESSAGES[streakCount];
      const template = getRandomMessage(messages);
      
      const notificationData: CreateNotificationData = {
        type: 'streak_achievement',
        title: template.title,
        message: template.message,
        priority: template.priority
      };

      const notification = await createNotification(notificationData);

      if (showToast && notification) {
        toast.success(template.title, {
          duration: 5000,
          icon: template.emoji,
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '2px solid #8b5cf6',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600'
          }
        });

        if (template.celebrationLevel === 'epic') {
          setTimeout(() => {
            toast.success(`${streakCount} days of self-awareness! You're incredible! 🎊`, {
              duration: 4000,
              icon: '🎉',
              style: {
                background: 'linear-gradient(45deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                border: '2px solid #a78bfa',
                borderRadius: '12px'
              }
            });
          }, 1500);
        }
      }

      if (template.celebrationLevel === 'epic') {
        triggerCelebrationAnimation('fireworks');
      }
    }

    // Daily mood appreciation (smaller celebration)
    else {
      // For low moods, trigger motivation animation
      if (moodLevel === 'low' || moodLevel === 'very_low') {
        await triggerMotivationAnimation(userId, 'low_mood', `Mood level: ${moodLevel}`, showToast);
        return;
      }
      
      // Normal appreciation for good moods
      const moodAppreciation = {
        'excellent': { emoji: '🌟', message: 'Your excellent mood is contagious! Keep shining!' },
        'good': { emoji: '😊', message: 'Good vibes logged! Your positivity matters!' },
        'neutral': { emoji: '📈', message: 'Thanks for checking in! Consistency builds awareness!' }
      };

      const appreciation = moodAppreciation[moodLevel as keyof typeof moodAppreciation] || moodAppreciation.neutral;
      
      if (showToast) {
        toast.success(appreciation.message, {
          duration: 3000,
          icon: appreciation.emoji,
          style: {
            background: '#374151',
            color: '#fff',
            border: '1px solid #6b7280',
            borderRadius: '8px'
          }
        });
      }
    }

  } catch (error) {
    console.error('Error triggering mood tracking appreciation:', error);
  }
};

// Function to trigger session completion appreciation
export const triggerSessionCompletionAppreciation = async (
  userId: number,
  sessionType: string = 'counseling',
  sessionNumber: number = 1,
  showToast: boolean = true
): Promise<void> => {
  try {
    const template = getRandomMessage(SESSION_COMPLETION_MESSAGES);
    
    let sessionMilestoneMessage = '';
    if (sessionNumber === 1) {
      sessionMilestoneMessage = '\n\n🌟 This was your first session - you took the most important step! Every journey begins with courage.';
    } else if (sessionNumber === 5) {
      sessionMilestoneMessage = '\n\n🏆 5 sessions completed! You\'re building real momentum in your wellness journey.';
    } else if (sessionNumber === 10) {
      sessionMilestoneMessage = '\n\n💎 10 sessions reached! Your dedication to growth is truly inspiring.';
    } else if (sessionNumber % 5 === 0) {
      sessionMilestoneMessage = `\n\n⭐ ${sessionNumber} sessions! Your commitment to yourself is paying off.`;
    }

    const personalizedMessage = `${template.message}${sessionMilestoneMessage}

Remember: Every conversation is a step forward, every insight is progress, and every session proves your commitment to becoming your best self! 🌱`;

    const notificationData: CreateNotificationData = {
      type: 'milestone',
      title: template.title,
      message: personalizedMessage,
      priority: template.priority
    };

    const notification = await createNotification(notificationData);

    if (showToast && notification) {
      toast.success(template.title, {
        duration: 5000,
        icon: template.emoji,
        style: {
          background: '#1a1a1a',
          color: '#fff',
          border: '2px solid #06b6d4',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600'
        }
      });

      // Special milestone celebrations
      if (sessionNumber === 1) {
        setTimeout(() => {
          toast.success('First session courage award! 🏅', {
            duration: 4000,
            icon: '🌟',
            style: {
              background: '#0891b2',
              color: '#fff',
              border: '2px solid #22d3ee',
              borderRadius: '12px'
            }
          });
        }, 1500);
      } else if ([5, 10].includes(sessionNumber)) {
        setTimeout(() => {
          toast.success(`${sessionNumber} sessions = Wellness dedication! 🎖️`, {
            duration: 4000,
            icon: '🏆',
            style: {
              background: 'linear-gradient(45deg, #0891b2, #0284c7)',
              color: '#fff',
              border: '2px solid #38bdf8',
              borderRadius: '12px'
            }
          });
        }, 1500);
      }
    }

    // Special animations for session milestones
    if ([1, 5, 10].includes(sessionNumber)) {
      triggerCelebrationAnimation('sparkles');
    }

  } catch (error) {
    console.error('Error triggering session completion appreciation:', error);
  }
};

// Animation trigger function (can be implemented with libraries like react-confetti)
export const triggerCelebrationAnimation = (animationType: 'confetti' | 'fireworks' | 'sparkles' | 'motivation'): void => {
  try {
    // Dispatch custom event for celebration animations
    const event = new CustomEvent('celebrationAnimation', { 
      detail: { type: animationType } 
    });
    window.dispatchEvent(event);
    
    console.log(`🎉 ${animationType === 'motivation' ? 'Motivation' : 'Celebration'} animation triggered: ${animationType}`);
  } catch (error) {
    console.error('Error triggering celebration animation:', error);
  }
};

// Function to trigger combo achievement celebration
export const triggerComboAchievementCelebration = async (
  userId: number,
  achievements: string[],
  showToast: boolean = true
): Promise<void> => {
  try {
    if (achievements.length < 2) return;

    const template = getRandomMessage(MILESTONE_COMBO_MESSAGES);
    const achievementList = achievements.map(a => `✅ ${a}`).join('\n');
    
    const personalizedMessage = `${template.message}

🎯 Today's Achievements:
${achievementList}

You're not just achieving goals - you're becoming the person who achieves goals! Keep up this incredible momentum! 🚀`;

    const notificationData: CreateNotificationData = {
      type: 'milestone',
      title: template.title,
      message: personalizedMessage,
      priority: template.priority
    };

    const notification = await createNotification(notificationData);

    if (showToast && notification) {
      toast.success(template.title, {
        duration: 6000,
        icon: template.emoji,
        style: {
          background: 'linear-gradient(45deg, #f59e0b, #d97706, #dc2626)',
          color: '#fff',
          border: '3px solid #fbbf24',
          borderRadius: '12px',
          fontSize: '18px',
          fontWeight: '700'
        }
      });

      setTimeout(() => {
        toast.success(`${achievements.length} achievements in one day! 🎊`, {
          duration: 4000,
          icon: '🏆',
          style: {
            background: 'linear-gradient(45deg, #dc2626, #b91c1c)',
            color: '#fff',
            border: '2px solid #f87171',
            borderRadius: '12px'
          }
        });
      }, 2000);
    }

    triggerCelebrationAnimation('fireworks');

  } catch (error) {
    console.error('Error triggering combo achievement celebration:', error);
  }
};
