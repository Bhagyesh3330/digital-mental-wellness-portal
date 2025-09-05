import { ApiResponse } from '@/types';
import { getMoodStats, getMoodEntriesForUser, initializeSampleMoodData } from '@/lib/storage/mood';
import { getGoalsByUserId, getGoalStats, initializeSampleGoals } from '@/lib/storage/goals';

// Get current user helper
const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('current_user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export interface ProgressStats {
  moodStats: {
    totalEntries: number;
    avgEnergy: number;
    avgSleep: number;
    avgStress: number;
    mostCommonMood: string;
    moodDistribution: { mood_level: string; count: number }[];
  };
  goalsStats: {
    totalGoals: number;
    completedGoals: number;
    inProgress: number;
    overdue: number;
    averageProgress: number;
  };
  wellnessScore: number;
  streaks: {
    currentMoodStreak: number;
    longestMoodStreak: number;
  };
}

export interface MoodTrendData {
  date: string;
  moodLevel: number;
  energyLevel: number;
  sleepHours: number;
  stressLevel: number;
}

class ProgressAPI {
  async getProgressStats(userId: number, days: number = 30): Promise<{ success: boolean; data?: ProgressStats; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Initialize sample data if needed
          await initializeSampleMoodData(userId);
          await initializeSampleGoals();
          
          // Get mood statistics from localStorage
          const moodStatsData = await getMoodStats(userId, days);
          
          // Get goals statistics from localStorage
          const userGoals = await getGoalsByUserId(userId);
          const completedGoals = userGoals.filter(g => g.isCompleted).length;
          const inProgress = userGoals.filter(g => !g.isCompleted && (!g.targetDate || new Date(g.targetDate) >= new Date())).length;
          const overdue = userGoals.filter(g => !g.isCompleted && g.targetDate && new Date(g.targetDate) < new Date()).length;
          const averageProgress = userGoals.length > 0 
            ? userGoals.reduce((sum, goal) => sum + goal.progressPercentage, 0) / userGoals.length
            : 0;
          
          const goalsStatsData = {
            totalGoals: userGoals.length,
            completedGoals,
            inProgress,
            overdue,
            averageProgress
          };

          // Calculate wellness score based on available data
          const moodScore = this.calculateMoodScore(moodStatsData.mood_distribution || []);
          const goalsScore = this.calculateGoalsScore(goalsStatsData);
          const wellnessScore = Math.round((moodScore + goalsScore) / 2);

          // Calculate streaks from mood entries
          const streaks = this.calculateStreaks(moodStatsData.mood_entries || []);

          const progressStats: ProgressStats = {
            moodStats: {
              totalEntries: parseInt(moodStatsData.stats?.total_entries?.toString() || '0'),
              avgEnergy: parseFloat(moodStatsData.stats?.avg_energy?.toString() || '0'),
              avgSleep: parseFloat(moodStatsData.stats?.avg_sleep?.toString() || '0'),
              avgStress: parseFloat(moodStatsData.stats?.avg_stress?.toString() || '0'),
              mostCommonMood: moodStatsData.stats?.most_common_mood || 'neutral',
              moodDistribution: moodStatsData.mood_distribution || []
            },
            goalsStats: goalsStatsData,
            wellnessScore,
            streaks
          };

          resolve({ success: true, data: progressStats });
        } catch (error: any) {
          console.error('Error fetching progress stats:', error);
          resolve({ success: false, error: 'Failed to fetch progress statistics' });
        }
      }, 100);
    });
  }

  async getMoodTrendData(userId: number, days: number = 30): Promise<{ success: boolean; data?: MoodTrendData[]; error?: string }> {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Initialize sample data if needed
          await initializeSampleMoodData(userId);
          
          const entries = await getMoodEntriesForUser(userId, days);
          
          const trendData: MoodTrendData[] = entries.map((entry: any) => ({
            date: entry.createdAt.split('T')[0],
            moodLevel: this.getMoodNumericValue(entry.moodLevel),
            energyLevel: entry.energyLevel,
            sleepHours: entry.sleepHours,
            stressLevel: entry.stressLevel
          }));

          resolve({ success: true, data: trendData.reverse() }); // Most recent first
        } catch (error: any) {
          console.error('Error fetching mood trend data:', error);
          resolve({ success: false, error: 'Failed to fetch mood trend data' });
        }
      }, 100);
    });
  }

  private calculateMoodScore(moodDistribution: { mood_level: string; count: number }[]): number {
    if (!moodDistribution.length) return 50;

    const totalEntries = moodDistribution.reduce((sum, mood) => sum + mood.count, 0);
    if (totalEntries === 0) return 50;

    const weightedSum = moodDistribution.reduce((sum, mood) => {
      const weight = this.getMoodNumericValue(mood.mood_level);
      return sum + (weight * mood.count);
    }, 0);

    const avgMood = weightedSum / totalEntries;
    return Math.round((avgMood / 5) * 100); // Convert to 0-100 scale
  }

  private calculateGoalsScore(goalsStats: { totalGoals: number; completedGoals: number; overdue: number }): number {
    if (goalsStats.totalGoals === 0) return 75; // Default score if no goals

    const completionRate = goalsStats.completedGoals / goalsStats.totalGoals;
    const overdueRate = goalsStats.overdue / goalsStats.totalGoals;
    
    // Base score from completion rate, penalty for overdue goals
    const baseScore = completionRate * 100;
    const penalty = overdueRate * 30;
    
    return Math.max(0, Math.round(baseScore - penalty));
  }

  private calculateStreaks(moodEntries: Array<{ created_at: string }>): { currentMoodStreak: number; longestMoodStreak: number } {
    if (!moodEntries.length) return { currentMoodStreak: 0, longestMoodStreak: 0 };

    const sortedEntries = moodEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if there's an entry today or yesterday
    const mostRecentEntry = new Date(sortedEntries[0].created_at);
    mostRecentEntry.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((today.getTime() - mostRecentEntry.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) {
      currentStreak = 1;
    }

    // Calculate streaks
    for (let i = 1; i < sortedEntries.length; i++) {
      const currentDate = new Date(sortedEntries[i - 1].created_at);
      const prevDate = new Date(sortedEntries[i].created_at);
      
      currentDate.setHours(0, 0, 0, 0);
      prevDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        tempStreak++;
        if (i === 1 && currentStreak > 0) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
        if (i === 1) {
          currentStreak = 0; // Break in recent streak
        }
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentMoodStreak: currentStreak, longestMoodStreak: longestStreak };
  }

  private getMoodNumericValue(moodLevel: string): number {
    switch (moodLevel) {
      case 'excellent': return 5;
      case 'good': return 4;
      case 'neutral': return 3;
      case 'low': return 2;
      case 'very_low': return 1;
      default: return 3;
    }
  }
}

export const progressApi = new ProgressAPI();
