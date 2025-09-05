// Real-time analytics storage system
// Calculates and stores computed statistics instead of raw data

import { getAllAppointments, getAppointmentsForUser } from './appointments';
import { getAllMoodEntries, getUserWellnessStats } from './mood';
import { getAllResources } from './resources';

export interface AnalyticsStats {
  // Student Statistics
  totalStudents: number;
  activeStudents: number; // Students with recent activity
  studentsAtRisk: number; // Students with wellness score < 50
  
  // Session Statistics
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  scheduledSessions: number;
  completionRate: number; // Percentage of completed sessions
  
  // Wellness Statistics
  averageWellnessScore: number;
  averageMoodRating: number; // 1-5 scale
  totalMoodEntries: number;
  
  // Resource Statistics
  totalResources: number;
  resourcesByType: {
    article: number;
    video: number;
    book: number;
    worksheet: number;
    reference: number;
  };
  
  // Time-based statistics
  lastUpdated: string;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

const ANALYTICS_KEY = 'wellness_analytics_stats';
const ANALYTICS_CACHE_KEY = 'wellness_analytics_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

// Get unique student IDs from various data sources
const getUniqueStudentIds = async (): Promise<number[]> => {
  const studentIds = new Set<number>();
  
  // From appointments
  const appointments = await getAllAppointments();
  appointments.forEach(apt => studentIds.add(apt.studentId));
  
  // From mood entries
  const moodEntries = await getAllMoodEntries();
  moodEntries.forEach(entry => studentIds.add(entry.userId));
  
  return Array.from(studentIds);
};

// Calculate real-time statistics
export const calculateRealTimeStats = async (): Promise<AnalyticsStats> => {
  console.log('Calculating real-time analytics statistics...');
  
  const appointments = await getAllAppointments();
  const moodEntries = await getAllMoodEntries();
  const resources = await getAllResources();
  const studentIds = await getUniqueStudentIds();
  
  // Student Statistics
  const totalStudents = studentIds.length;
  
  // Check for recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeStudentIds = new Set<number>();
  const weeklyActiveIds = new Set<number>();
  const monthlyActiveIds = new Set<number>();
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  // Check recent appointments for activity
  appointments.forEach(apt => {
    const aptDate = new Date(apt.createdAt);
    if (aptDate >= thirtyDaysAgo) {
      activeStudentIds.add(apt.studentId);
      monthlyActiveIds.add(apt.studentId);
    }
    if (aptDate >= sevenDaysAgo) {
      weeklyActiveIds.add(apt.studentId);
    }
  });
  
  // Check recent mood entries for activity
  moodEntries.forEach(entry => {
    const entryDate = new Date(entry.createdAt);
    if (entryDate >= thirtyDaysAgo) {
      activeStudentIds.add(entry.userId);
      monthlyActiveIds.add(entry.userId);
    }
    if (entryDate >= sevenDaysAgo) {
      weeklyActiveIds.add(entry.userId);
    }
  });
  
  const activeStudents = activeStudentIds.size;
  const weeklyActiveUsers = weeklyActiveIds.size;
  const monthlyActiveUsers = monthlyActiveIds.size;
  
  // Calculate students at risk
  let studentsAtRisk = 0;
  let totalWellnessScore = 0;
  let totalMoodRating = 0;
  let studentsWithWellnessData = 0;
  
  for (const studentId of studentIds) {
    const wellnessStats = await getUserWellnessStats(studentId);
    if (wellnessStats.totalEntries > 0) {
      studentsWithWellnessData++;
      totalWellnessScore += wellnessStats.wellnessScore;
      totalMoodRating += wellnessStats.averageMood;
      
      if (wellnessStats.isAtRisk) {
        studentsAtRisk++;
      }
    }
  }
  
  const averageWellnessScore = studentsWithWellnessData > 0 
    ? Math.round(totalWellnessScore / studentsWithWellnessData) 
    : 50;
    
  const averageMoodRating = studentsWithWellnessData > 0 
    ? Math.round((totalMoodRating / studentsWithWellnessData) * 10) / 10 
    : 3.0;
  
  // Session Statistics
  const totalSessions = appointments.length;
  const completedSessions = appointments.filter(apt => apt.status === 'completed').length;
  const cancelledSessions = appointments.filter(apt => apt.status === 'cancelled').length;
  const scheduledSessions = appointments.filter(apt => apt.status === 'scheduled').length;
  
  const completionRate = totalSessions > 0 
    ? Math.round((completedSessions / totalSessions) * 100) 
    : 0;
  
  // Resource Statistics
  const totalResources = resources.length;
  const resourcesByType = {
    article: resources.filter(r => r.type === 'article').length,
    video: resources.filter(r => r.type === 'video').length,
    book: resources.filter(r => r.type === 'book').length,
    worksheet: resources.filter(r => r.type === 'worksheet').length,
    reference: resources.filter(r => r.type === 'reference').length
  };
  
  const stats: AnalyticsStats = {
    totalStudents,
    activeStudents,
    studentsAtRisk,
    totalSessions,
    completedSessions,
    cancelledSessions,
    scheduledSessions,
    completionRate,
    averageWellnessScore,
    averageMoodRating,
    totalMoodEntries: moodEntries.length,
    totalResources,
    resourcesByType,
    lastUpdated: new Date().toISOString(),
    weeklyActiveUsers,
    monthlyActiveUsers
  };
  
  console.log('Calculated analytics stats:', stats);
  return stats;
};

// Get cached statistics or calculate new ones
export const getAnalyticsStats = async (): Promise<AnalyticsStats> => {
  if (typeof window === 'undefined') {
    return await calculateRealTimeStats();
  }
  
  try {
    const cached = localStorage.getItem(ANALYTICS_CACHE_KEY);
    if (cached) {
      const { stats, timestamp } = JSON.parse(cached);
      const now = Date.now();
      
      // If cache is still valid, return cached data
      if (now - timestamp < CACHE_DURATION) {
        console.log('Using cached analytics stats');
        return stats;
      }
    }
  } catch (error) {
    console.error('Error reading analytics cache:', error);
  }
  
  // Calculate new stats and cache them
  const stats = await calculateRealTimeStats();
  updateAnalyticsCache(stats);
  return stats;
};

// Update analytics cache
export const updateAnalyticsCache = (stats: AnalyticsStats): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const cacheData = {
      stats,
      timestamp: Date.now()
    };
    localStorage.setItem(ANALYTICS_CACHE_KEY, JSON.stringify(cacheData));
    console.log('Analytics cache updated');
  } catch (error) {
    console.error('Error updating analytics cache:', error);
  }
};

// Force refresh of analytics statistics
export const refreshAnalyticsStats = async (): Promise<AnalyticsStats> => {
  console.log('Force refreshing analytics stats...');
  
  // Clear cache
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ANALYTICS_CACHE_KEY);
  }
  
  // Calculate and cache new stats
  const stats = await calculateRealTimeStats();
  updateAnalyticsCache(stats);
  
  return stats;
};

// Clear all analytics data
export const clearAnalyticsData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(ANALYTICS_KEY);
    localStorage.removeItem(ANALYTICS_CACHE_KEY);
    console.log('Analytics data cleared');
  } catch (error) {
    console.error('Error clearing analytics data:', error);
  }
};

// Get analytics summary for debugging
export const getAnalyticsSummary = async () => {
  const stats = await getAnalyticsStats();
  
  return {
    overview: {
      totalStudents: stats.totalStudents,
      totalSessions: stats.totalSessions,
      completionRate: `${stats.completionRate}%`,
      averageWellnessScore: stats.averageWellnessScore
    },
    activity: {
      weeklyActive: stats.weeklyActiveUsers,
      monthlyActive: stats.monthlyActiveUsers,
      studentsAtRisk: stats.studentsAtRisk
    },
    resources: {
      total: stats.totalResources,
      byType: stats.resourcesByType
    },
    lastUpdated: stats.lastUpdated
  };
};
