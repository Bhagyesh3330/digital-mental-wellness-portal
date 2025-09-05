// Daily wellness analyzer - determines when to celebrate or motivate
// This analyzes daily activities and triggers appropriate animations

import { triggerCelebrationAnimation, triggerMotivationAnimation, triggerComboAnimation } from '@/components/ui/WellnessAnimations';
import { getMoodEntriesForUser, calculateMoodStreak } from '@/lib/storage/mood';
import { getGoalsForUser } from '@/lib/api/goals';

export interface DailyWellnessData {
  date: string;
  userId: number;
  moodEntries: any[];
  completedGoals: any[];
  sleepHours?: number;
  averageMoodLevel: string;
  goalCompletionRate: number;
  hasGoodSleep: boolean;
  hasGoodMood: boolean;
  hasCompletedGoals: boolean;
}

export interface WellnessAnalysis {
  overallScore: number;
  celebrationTriggers: string[];
  motivationTriggers: string[];
  shouldCelebrate: boolean;
  shouldMotivate: boolean;
  isComboDay: boolean;
}

// Main function to analyze daily wellness and trigger appropriate animations
export const analyzeDailyWellnessAndAnimate = async (
  userId: number,
  triggerData?: {
    goalCompleted?: { title: string; type: string };
    moodLogged?: { level: string; sleepHours?: number };
    sessionCompleted?: boolean;
  }
): Promise<void> => {
  try {
    // Safety checks
    if (!userId || userId <= 0) {
      console.warn('Invalid userId provided to analyzeDailyWellnessAndAnimate:', userId);
      return;
    }

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('Skipping wellness animation in server-side environment');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyData = await getDailyWellnessData(userId, today);
    const analysis = analyzeDailyWellness(dailyData);

    console.log('Daily wellness analysis:', analysis);

    // Handle specific trigger first (immediate feedback)
    if (triggerData) {
      await handleSpecificTrigger(triggerData, dailyData);
    }

    // Then handle overall daily analysis (broader context) - but only in shorter form
    // to avoid overwhelming the user with too many animations
    // await handleDailyAnalysis(analysis, dailyData);

  } catch (error) {
    console.error('Error in daily wellness analysis:', error);
  }
};

// Get comprehensive daily wellness data
export const getDailyWellnessData = async (userId: number, date: string): Promise<DailyWellnessData> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    // Get mood entries for the day
    const allMoodEntries = await getMoodEntriesForUser(userId, 1);
    const todayMoodEntries = allMoodEntries.filter(entry => {
      const entryDate = new Date(entry.createdAt);
      return entryDate >= startOfDay && entryDate <= endOfDay;
    });

    // Get goals for the day (simplified - in real app would filter by completion date)
    let completedGoals: any[] = [];
    try {
      const goalsResponse = await getGoalsForUser(userId);
      if (goalsResponse.success && goalsResponse.data) {
        completedGoals = goalsResponse.data.goals.filter((goal: any) => goal.isCompleted);
      }
    } catch (error) {
      console.log('Could not fetch goals, using empty array');
    }

    // Calculate average mood level
    const averageMoodLevel = calculateAverageMoodLevel(todayMoodEntries);
    
    // Calculate sleep hours (from latest mood entry)
    const sleepHours = todayMoodEntries.length > 0 ? todayMoodEntries[0].sleepHours : undefined;

    // Calculate metrics
    const hasGoodSleep = sleepHours ? sleepHours >= 7 : false;
    const hasGoodMood = ['good', 'excellent'].includes(averageMoodLevel);
    const hasCompletedGoals = completedGoals.length > 0;

    return {
      date,
      userId,
      moodEntries: todayMoodEntries,
      completedGoals,
      sleepHours,
      averageMoodLevel,
      goalCompletionRate: completedGoals.length > 0 ? 100 : 0, // Simplified
      hasGoodSleep,
      hasGoodMood,
      hasCompletedGoals
    };
  } catch (error) {
    console.error('Error getting daily wellness data:', error);
    // Return default data
    return {
      date,
      userId,
      moodEntries: [],
      completedGoals: [],
      averageMoodLevel: 'neutral',
      goalCompletionRate: 0,
      hasGoodSleep: false,
      hasGoodMood: false,
      hasCompletedGoals: false
    };
  }
};

// Analyze daily wellness and determine what animations to trigger
export const analyzeDailyWellness = (dailyData: DailyWellnessData): WellnessAnalysis => {
  const { hasGoodSleep, hasGoodMood, hasCompletedGoals, moodEntries, sleepHours } = dailyData;
  
  const celebrationTriggers: string[] = [];
  const motivationTriggers: string[] = [];

  // Check for celebration triggers
  if (hasCompletedGoals) {
    celebrationTriggers.push('Goals Completed');
  }
  if (hasGoodMood) {
    celebrationTriggers.push('Positive Mood');
  }
  if (hasGoodSleep) {
    celebrationTriggers.push('Good Sleep');
  }
  if (moodEntries.length > 0) {
    celebrationTriggers.push('Mood Tracked');
  }

  // Check for motivation triggers
  if (!hasCompletedGoals && dailyData.completedGoals.length === 0) {
    motivationTriggers.push('No goals completed today');
  }
  if (!hasGoodMood && moodEntries.length > 0) {
    if (['low', 'very_low'].includes(dailyData.averageMoodLevel)) {
      motivationTriggers.push('Low mood detected');
    }
  }
  if (!hasGoodSleep && sleepHours && sleepHours < 6) {
    motivationTriggers.push('Poor sleep');
  }

  // Calculate overall score
  let overallScore = 0;
  if (hasCompletedGoals) overallScore += 30;
  if (hasGoodMood) overallScore += 35;
  if (hasGoodSleep) overallScore += 25;
  if (moodEntries.length > 0) overallScore += 10; // Bonus for tracking

  // Determine animation strategy
  const shouldCelebrate = celebrationTriggers.length >= 2 || overallScore >= 50;
  const shouldMotivate = motivationTriggers.length > 0 && !shouldCelebrate;
  const isComboDay = celebrationTriggers.length >= 3;

  return {
    overallScore,
    celebrationTriggers,
    motivationTriggers,
    shouldCelebrate,
    shouldMotivate,
    isComboDay
  };
};

// Handle specific immediate triggers (goal completion, mood logging, etc.)
const handleSpecificTrigger = async (
  triggerData: any,
  dailyData: DailyWellnessData
): Promise<void> => {
  try {
    if (triggerData.goalCompleted) {
      // Always celebrate goal completion
      triggerCelebrationAnimation('goal_complete', {
        goalTitle: triggerData.goalCompleted.title,
        goalType: triggerData.goalCompleted.type
      });
    }
  } catch (error) {
    console.error('Error in handleSpecificTrigger for goal completion:', error);
  }

  try {
    if (triggerData.moodLogged) {
      const { level, sleepHours } = triggerData.moodLogged;
      
      // Celebrate good moods
      if (['good', 'excellent'].includes(level)) {
        triggerCelebrationAnimation('good_mood', {
          moodLevel: level
        });
      }
      // Motivate for low moods
      else if (['low', 'very_low'].includes(level)) {
        triggerMotivationAnimation('low_mood', {
          moodLevel: level
        });
      }

      // Handle sleep-related animations
      if (sleepHours) {
        if (sleepHours >= 8) {
          setTimeout(() => {
            try {
              triggerCelebrationAnimation('good_sleep', {
                sleepHours
              });
            } catch (error) {
              console.error('Error triggering good sleep animation:', error);
            }
          }, 1500); // Delay to avoid animation overlap
        } else if (sleepHours < 6) {
          setTimeout(() => {
            try {
              triggerMotivationAnimation('poor_sleep', {
                sleepHours
              });
            } catch (error) {
              console.error('Error triggering poor sleep animation:', error);
            }
          }, 1500);
        }
      }
    }
  } catch (error) {
    console.error('Error in handleSpecificTrigger for mood logging:', error);
  }
};

// Handle overall daily analysis and combo animations
const handleDailyAnalysis = async (
  analysis: WellnessAnalysis,
  dailyData: DailyWellnessData
): Promise<void> => {
  // Wait a bit to avoid overlapping with specific triggers
  await new Promise(resolve => setTimeout(resolve, 3000));

  if (analysis.isComboDay) {
    // Epic combo celebration!
    triggerComboAnimation(analysis.celebrationTriggers);
  } else if (analysis.shouldCelebrate && analysis.celebrationTriggers.length === 1) {
    // Single achievement celebration (if not already triggered)
    console.log('Single achievement celebration already handled by specific trigger');
  } else if (analysis.shouldMotivate) {
    // General motivation for incomplete day
    const primaryIssue = analysis.motivationTriggers[0];
    if (primaryIssue.includes('goal')) {
      triggerMotivationAnimation('goal_incomplete', {
        message: 'Every small step counts. Tomorrow is a fresh start!'
      });
    } else if (primaryIssue.includes('mood')) {
      triggerMotivationAnimation('low_mood', {
        message: 'Your feelings are valid. Take it one moment at a time.'
      });
    } else if (primaryIssue.includes('sleep')) {
      triggerMotivationAnimation('poor_sleep', {
        sleepHours: dailyData.sleepHours
      });
    }
  }
};

// Helper function to calculate average mood level
const calculateAverageMoodLevel = (moodEntries: any[]): string => {
  if (moodEntries.length === 0) return 'neutral';

  const moodValues = {
    'very_low': 1,
    'low': 2,
    'neutral': 3,
    'good': 4,
    'excellent': 5
  };

  const reverseValues = {
    1: 'very_low',
    2: 'low',
    3: 'neutral',
    4: 'good',
    5: 'excellent'
  };

  const totalValue = moodEntries.reduce((sum, entry) => {
    return sum + (moodValues[entry.moodLevel as keyof typeof moodValues] || 3);
  }, 0);

  const averageValue = Math.round(totalValue / moodEntries.length);
  return reverseValues[averageValue as keyof typeof reverseValues] || 'neutral';
};

// Function to check and trigger end-of-day summary
export const triggerEndOfDaySummary = async (userId: number): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const dailyData = await getDailyWellnessData(userId, today);
    const analysis = analyzeDailyWellness(dailyData);

    console.log('End of day summary:', { dailyData, analysis });

    // Only trigger end-of-day animations if it's actually evening
    const currentHour = new Date().getHours();
    if (currentHour >= 18 || currentHour <= 6) { // Evening or early morning
      await handleDailyAnalysis(analysis, dailyData);
    }
  } catch (error) {
    console.error('Error in end of day summary:', error);
  }
};

// Export utility function for manual testing
export const testWellnessAnimations = () => {
  console.log('Testing wellness animations...');
  
  // Test celebration
  setTimeout(() => {
    triggerCelebrationAnimation('goal_complete', { goalTitle: 'Test Goal' });
  }, 1000);

  // Test motivation
  setTimeout(() => {
    triggerMotivationAnimation('goal_incomplete', { goalTitle: 'Missed Goal' });
  }, 4000);

  // Test combo
  setTimeout(() => {
    triggerComboAnimation(['Goal Completed', 'Good Mood', 'Good Sleep']);
  }, 7000);
};
