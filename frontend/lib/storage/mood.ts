// Mood tracker storage using SQLite database

// Note: Wellness score change notifications are now handled through API calls
import { createWellnessScoreNotification, MoodChangeData, shouldCreateNotification } from '@/lib/utils/notification-triggers';

export interface StoredMoodEntry {
  id: number;
  userId: number;
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel: number; // 1-10
  sleepHours: number;
  stressLevel: number; // 1-10
  createdAt: string;
}

// API endpoint for mood entries
const API_BASE = '/api';

// Fetch all mood entries from database
export const getAllMoodEntries = async (): Promise<StoredMoodEntry[]> => {
  try {
    const response = await fetch(`${API_BASE}/mood-entries`);
    if (!response.ok) {
      throw new Error('Failed to fetch mood entries');
    }
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return [];
  }
};

// Get mood entries for a specific user
export const getMoodEntriesForUser = async (userId: number, limit?: number): Promise<StoredMoodEntry[]> => {
  try {
    const url = limit 
      ? `${API_BASE}/mood-entries/user/${userId}?limit=${limit}`
      : `${API_BASE}/mood-entries/user/${userId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch user mood entries');
    }
    
    const data = await response.json();
    return data.entries || [];
  } catch (error) {
    console.error('Error fetching user mood entries:', error);
    return [];
  }
};

// Create a new mood entry
export const createMoodEntry = async (entryData: {
  userId: number;
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel?: number;
  sleepHours: number;
  stressLevel: number;
}): Promise<StoredMoodEntry> => {
  try {
    // Calculate previous wellness score for notifications
    const previousScore = await calculateWellnessScore(entryData.userId);
    
    const response = await fetch(`${API_BASE}/mood-entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entryData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create mood entry');
    }
    
    const data = await response.json();
    const newEntry = data.entry;
    
    // Calculate new wellness score after entry
    const currentScore = await calculateWellnessScore(entryData.userId);
    
    // Trigger wellness score notification if there's a significant change
    if (shouldCreateNotification()) {
      const moodChangeData: MoodChangeData = {
        userId: entryData.userId,
        previousScore: previousScore > 0 ? previousScore : undefined,
        currentScore,
        moodLevel: entryData.moodLevel,
        energyLevel: entryData.energyLevel || 5,
        sleepHours: entryData.sleepHours,
        stressLevel: entryData.stressLevel
      };
      
      // Create notification asynchronously
      createWellnessScoreNotification(moodChangeData).catch(error => {
        console.error('Failed to create wellness notification:', error);
      });
    }
    
    return newEntry;
  } catch (error) {
    console.error('Error creating mood entry:', error);
    throw error;
  }
};

// Get wellness score for user (based on recent mood entries)
export const calculateWellnessScore = async (userId: number, days: number = 7): Promise<number> => {
  const recentEntries = await getMoodEntriesForUser(userId, days);
  
  if (recentEntries.length === 0) return 50; // Default neutral score
  
  const totalScore = recentEntries.reduce((sum, entry) => {
    const moodScore = {
      'very_low': 20,
      'low': 40,
      'neutral': 60,
      'good': 80,
      'excellent': 100
    }[entry.moodLevel];
    
    // Factor in energy, sleep, and stress
    const energyBonus = (entry.energyLevel - 5) * 2; // -8 to +10
    const sleepBonus = entry.sleepHours >= 7 ? 5 : entry.sleepHours >= 6 ? 0 : -5;
    const stressReduction = (10 - entry.stressLevel) * 1; // -9 to +9
    
    return sum + moodScore + energyBonus + sleepBonus + stressReduction;
  }, 0);
  
  const averageScore = totalScore / recentEntries.length;
  return Math.max(0, Math.min(100, Math.round(averageScore)));
};

// Calculate mood entry streak for user
export const calculateMoodStreak = async (userId: number): Promise<number> => {
  const entries = await getMoodEntriesForUser(userId);
  if (entries.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check consecutive days starting from today
  for (let i = 0; i < 365; i++) { // Max 365 day streak
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    // Check if there's an entry for this date
    const hasEntryForDate = entries.some(entry => {
      const entryDate = new Date(entry.createdAt);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === checkDate.getTime();
    });

    if (hasEntryForDate) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  return streak;
};

// Calculate wellness activities streak (mood + sleep entries)
export const calculateWellnessStreak = async (userId: number): Promise<number> => {
  const moodStreak = await calculateMoodStreak(userId);
  // For now, wellness streak is the same as mood streak
  // This could be extended to include other wellness activities
  return moodStreak;
};

// Get wellness statistics for a user
export const getUserWellnessStats = async (userId: number) => {
  const entries = await getMoodEntriesForUser(userId, 30); // Last 30 days
  const wellnessScore = await calculateWellnessScore(userId);
  const moodStreak = await calculateMoodStreak(userId);
  const wellnessStreak = await calculateWellnessStreak(userId);
  
  // Calculate average mood over last 7 days
  const recentEntries = await getMoodEntriesForUser(userId, 7);
  const avgMoodValue = recentEntries.length > 0 
    ? recentEntries.reduce((sum, entry) => {
        const moodValues = { 'very_low': 1, 'low': 2, 'neutral': 3, 'good': 4, 'excellent': 5 };
        return sum + moodValues[entry.moodLevel];
      }, 0) / recentEntries.length
    : 3; // Default neutral
  
  return {
    wellnessScore,
    moodStreak,
    wellnessStreak,
    totalEntries: entries.length,
    averageMood: Math.round(avgMoodValue * 10) / 10, // Round to 1 decimal
    lastEntryDate: entries.length > 0 ? entries[0].createdAt : null,
    isAtRisk: wellnessScore < 50
  };
};

// Create a sleep entry (mood entry with focus on sleep)
export const createSleepEntry = async (sleepData: {
  userId: number;
  sleepHours: number;
  sleepQuality?: number; // 1-5
  notes?: string;
}): Promise<StoredMoodEntry> => {
  
  // Calculate mood level based on sleep hours and quality
  const calculateMoodFromSleep = (hours: number, quality: number = 3): 'very_low' | 'low' | 'neutral' | 'good' | 'excellent' => {
    let moodScore = 0;
    
    // Sleep hours contribution (0-3 points)
    if (hours >= 7 && hours <= 9) moodScore += 3; // Optimal
    else if (hours >= 6 && hours <= 10) moodScore += 2; // Good
    else if (hours >= 5 && hours <= 11) moodScore += 1; // Fair
    else moodScore += 0; // Poor
    
    // Sleep quality contribution (0-2 points)
    if (quality >= 4) moodScore += 2;
    else if (quality >= 3) moodScore += 1;
    else moodScore += 0;
    
    // Convert to mood level
    if (moodScore >= 4) return 'excellent';
    if (moodScore >= 3) return 'good';
    if (moodScore >= 2) return 'neutral';
    if (moodScore >= 1) return 'low';
    return 'very_low';
  };
  
  // Calculate energy level based on sleep
  const calculateEnergyFromSleep = (hours: number, quality: number = 3): number => {
    let energy = 5; // Base energy
    
    // Sleep hours impact
    if (hours >= 7 && hours <= 9) energy += 3;
    else if (hours >= 6 && hours <= 10) energy += 2;
    else if (hours >= 5 && hours <= 11) energy += 1;
    else if (hours < 5) energy -= 2;
    else energy -= 1; // Too much sleep
    
    // Quality impact
    energy += (quality - 3); // -2 to +2
    
    return Math.max(1, Math.min(10, energy));
  };
  
  // Calculate stress level (inverse of sleep quality)
  const calculateStressFromSleep = (hours: number, quality: number = 3): number => {
    let stress = 5; // Base stress
    
    if (hours < 6) stress += 2;
    else if (hours > 10) stress += 1;
    else if (hours >= 7 && hours <= 9) stress -= 1;
    
    stress += (3 - quality); // Better quality = less stress
    
    return Math.max(1, Math.min(10, stress));
  };
  
  const sleepQuality = sleepData.sleepQuality || 3;
  const moodLevel = calculateMoodFromSleep(sleepData.sleepHours, sleepQuality);
  
  // Convert sleep data to mood entry format and create via API
  return await createMoodEntry({
    userId: sleepData.userId,
    moodLevel,
    notes: sleepData.notes,
    energyLevel: calculateEnergyFromSleep(sleepData.sleepHours, sleepQuality),
    sleepHours: sleepData.sleepHours,
    stressLevel: calculateStressFromSleep(sleepData.sleepHours, sleepQuality)
  });
};

// Get sleep statistics for a user
export const getSleepStats = async (userId: number, days: number = 30) => {
  const entries = await getMoodEntriesForUser(userId, days);
  
  if (entries.length === 0) {
    return {
      stats: {
        avg_sleep: 0,
        min_sleep: 0,
        max_sleep: 0,
        avg_energy: 0,
        total_entries: 0
      },
      sleepPattern: []
    };
  }
  
  const sleepHours = entries.map(e => e.sleepHours);
  const energyLevels = entries.map(e => e.energyLevel);
  
  const stats = {
    avg_sleep: sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length,
    min_sleep: Math.min(...sleepHours),
    max_sleep: Math.max(...sleepHours),
    avg_energy: energyLevels.reduce((a, b) => a + b, 0) / energyLevels.length,
    total_entries: entries.length
  };
  
  const sleepPattern = entries.slice(0, 14).map(entry => ({
    date: entry.createdAt.split('T')[0],
    sleep_hours: entry.sleepHours,
    energy_level: entry.energyLevel
  }));
  
  return { stats, sleepPattern };
};

// Get mood statistics for progress reports
export const getMoodStats = async (userId: number, days: number = 30) => {
  const entries = await getMoodEntriesForUser(userId, days);
  
  if (entries.length === 0) {
    return {
      stats: {
        total_entries: 0,
        avg_energy: 0,
        avg_sleep: 0,
        avg_stress: 0,
        most_common_mood: 'neutral'
      },
      mood_distribution: [],
      mood_entries: []
    };
  }
  
  // Calculate statistics
  const totalEntries = entries.length;
  const avgEnergy = entries.reduce((sum, entry) => sum + entry.energyLevel, 0) / totalEntries;
  const avgSleep = entries.reduce((sum, entry) => sum + entry.sleepHours, 0) / totalEntries;
  const avgStress = entries.reduce((sum, entry) => sum + entry.stressLevel, 0) / totalEntries;
  
  // Find most common mood
  const moodCounts = entries.reduce((acc, entry) => {
    acc[entry.moodLevel] = (acc[entry.moodLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const mostCommonMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b
  );
  
  // Create mood distribution
  const moodDistribution = Object.entries(moodCounts).map(([mood_level, count]) => ({
    mood_level,
    count
  }));
  
  return {
    stats: {
      total_entries: totalEntries,
      avg_energy: avgEnergy,
      avg_sleep: avgSleep,
      avg_stress: avgStress,
      most_common_mood: mostCommonMood
    },
    mood_distribution: moodDistribution,
    mood_entries: entries.map(entry => ({
      mood_level: entry.moodLevel,
      energy_level: entry.energyLevel,
      sleep_hours: entry.sleepHours,
      stress_level: entry.stressLevel,
      created_at: entry.createdAt,
      notes: entry.notes
    }))
  };
};

// Note: Sample mood data is now initialized in the server-side database setup
export const initializeSampleMoodData = async (userId: number): Promise<void> => {
  // Check if user already has mood entries
  const entries = await getMoodEntriesForUser(userId, 1);
  if (entries.length > 0) return; // Already has data for this user
  
  // Sample data is handled by server initialization
  console.log('Sample mood data initialization handled by server');
};
