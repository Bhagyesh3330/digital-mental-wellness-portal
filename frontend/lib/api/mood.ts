import { MoodEntry, ApiResponse } from '@/types';
import { getCurrentUser } from '@/lib/storage/users';
import { getMoodEntriesForUser, initializeSampleMoodData, createMoodEntry as createMoodEntryStorage, getMoodStats } from '@/lib/storage/mood';

export interface CreateMoodEntryData {
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel?: number; // 1-10, will be calculated if not provided
  sleepHours: number;
  stressLevel: number; // 1-10
}

export interface CreateSleepEntryData {
  sleepHours: number;
  sleepQuality?: number; // 1-5
  notes?: string;
}

export const moodApi = {
  // Get mood entries for current user
  getMyMoodEntries: async (limit?: number): Promise<ApiResponse<{ moodEntries: MoodEntry[] }>> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            resolve({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }
          
          await initializeSampleMoodData(currentUser.id);
          
          const entries = await getMoodEntriesForUser(currentUser.id, limit) as MoodEntry[];
          resolve({
            success: true,
            data: { moodEntries: entries }
          });
        } catch (error) {
          console.error('Error fetching mood entries:', error);
          resolve({
            success: false,
            error: 'Failed to fetch mood entries'
          });
        }
      }, 100);
    });
  },

  // Create a new mood entry
  createMoodEntry: async (data: CreateMoodEntryData): Promise<ApiResponse<{ moodEntry: MoodEntry }>> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            resolve({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }

          const entry = await createMoodEntryStorage({
            userId: currentUser.id,
            moodLevel: data.moodLevel,
            notes: data.notes,
            energyLevel: data.energyLevel,
            sleepHours: data.sleepHours,
            stressLevel: data.stressLevel
          }) as MoodEntry;
          
          resolve({
            success: true,
            data: { moodEntry: entry },
            message: 'Mood entry created successfully'
          });
        } catch (error: any) {
          console.error('Create Mood Entry Error:', error);
          resolve({
            success: false,
            error: 'Failed to create mood entry'
          });
        }
      }, 100);
    });
  },

  // Get mood statistics
  getMoodStats: async (days?: number): Promise<ApiResponse<any>> => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          const currentUser = getCurrentUser();
          if (!currentUser) {
            resolve({
              success: false,
              error: 'User not authenticated'
            });
            return;
          }

          // Initialize sample data if needed
          await initializeSampleMoodData(currentUser.id);
          
          const stats = await getMoodStats(currentUser.id, days || 30);
          resolve({
            success: true,
            data: stats
          });
        } catch (error: any) {
          console.error('Mood Stats API Error:', error);
          resolve({
            success: false,
            error: 'Failed to fetch mood statistics'
          });
        }
      }, 100);
    });
  },

  // Create a sleep entry (energy will be auto-calculated)
  createSleepEntry: async (data: CreateSleepEntryData & { userId: number }): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch('/api/sleep-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        return { success: false, error: responseData.error || 'Failed to create sleep entry' };
      }
      
      return {
        success: true,
        data: { sleepEntry: responseData.sleepEntry },
        message: `Sleep logged successfully! Energy level: ${responseData.sleepEntry.energyLevel}/10`
      };
    } catch (error: any) {
      console.error('Create Sleep Entry Error:', error);
      return {
        success: false,
        error: 'Failed to create sleep entry'
      };
    }
  },

  // Get sleep statistics
  getSleepStats: async (userId: number, days?: number): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`/api/mood-entries/user/${userId}/stats?days=${days || 30}&type=sleep`);
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch sleep statistics' };
      }
      
      return {
        success: true,
        data: data
      };
    } catch (error: any) {
      console.error('Sleep Stats API Error:', error);
      return {
        success: false,
        error: 'Failed to fetch sleep statistics'
      };
    }
  }
};
