import { getDatabase } from '../connection';

export interface DatabaseMoodEntry {
  id: number;
  userId: number;
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel: number;
  sleepHours: number;
  stressLevel: number;
  createdAt: string;
}

export interface CreateMoodEntryData {
  userId: number;
  moodLevel: 'very_low' | 'low' | 'neutral' | 'good' | 'excellent';
  notes?: string;
  energyLevel?: number;
  sleepHours: number;
  stressLevel: number;
}

export interface CreateSleepEntryData {
  userId: number;
  sleepHours: number;
  sleepQuality?: number;
  notes?: string;
}

class MoodModel {
  private db = getDatabase();

  // Get mood entries for a user
  getMoodEntriesForUser(userId: number, limit?: number): DatabaseMoodEntry[] {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    const stmt = this.db.prepare(`
      SELECT * FROM mood_entries 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      ${limitClause}
    `);

    return stmt.all(userId) as DatabaseMoodEntry[];
  }

  // Get mood entry by ID
  getMoodEntryById(id: number): DatabaseMoodEntry | null {
    const stmt = this.db.prepare('SELECT * FROM mood_entries WHERE id = ?');
    const result = stmt.get(id) as DatabaseMoodEntry;
    return result || null;
  }

  // Create mood entry
  createMoodEntry(entryData: CreateMoodEntryData): DatabaseMoodEntry {
    // Calculate energy level based on mood and sleep if not provided
    const energyLevel = entryData.energyLevel || this.calculateEnergyLevel(
      entryData.moodLevel,
      entryData.sleepHours,
      entryData.stressLevel
    );

    const stmt = this.db.prepare(`
      INSERT INTO mood_entries (userId, moodLevel, notes, energyLevel, sleepHours, stressLevel)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      entryData.userId,
      entryData.moodLevel,
      entryData.notes || null,
      energyLevel,
      entryData.sleepHours,
      entryData.stressLevel
    );

    const newEntry = this.getMoodEntryById(result.lastInsertRowid as number);
    if (!newEntry) {
      throw new Error('Failed to create mood entry');
    }

    console.log(`Mood entry created: ${newEntry.moodLevel} for user ${newEntry.userId}`);
    return newEntry;
  }

  // Create sleep entry (specialized mood entry)
  createSleepEntry(sleepData: CreateSleepEntryData): DatabaseMoodEntry {
    const moodLevel = this.calculateMoodFromSleep(sleepData.sleepHours, sleepData.sleepQuality);
    const energyLevel = this.calculateEnergyFromSleep(sleepData.sleepHours, sleepData.sleepQuality);
    const stressLevel = this.calculateStressFromSleep(sleepData.sleepHours, sleepData.sleepQuality);

    const stmt = this.db.prepare(`
      INSERT INTO mood_entries (userId, moodLevel, notes, energyLevel, sleepHours, stressLevel)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      sleepData.userId,
      moodLevel,
      sleepData.notes || null,
      energyLevel,
      sleepData.sleepHours,
      stressLevel
    );

    const newEntry = this.getMoodEntryById(result.lastInsertRowid as number);
    if (!newEntry) {
      throw new Error('Failed to create sleep entry');
    }

    console.log(`Sleep entry created: ${sleepData.sleepHours}h sleep for user ${sleepData.userId}`);
    return newEntry;
  }

  // Get mood statistics for a user
  getMoodStats(userId: number, days: number = 30) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as totalEntries,
        AVG(energyLevel) as avgEnergy,
        AVG(sleepHours) as avgSleep,
        AVG(stressLevel) as avgStress,
        moodLevel
      FROM mood_entries
      WHERE userId = ? AND createdAt > datetime(\'now\', \'-${days} days\')
      GROUP BY moodLevel
      ORDER BY COUNT(*) DESC
    `);

    const moodDistribution = stmt.all(userId) as any[];

    const statsStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as totalEntries,
        AVG(energyLevel) as avgEnergy,
        AVG(sleepHours) as avgSleep,
        AVG(stressLevel) as avgStress
      FROM mood_entries
      WHERE userId = ? AND createdAt > datetime(\'now\', \'-${days} days\')
    `);

    const stats = statsStmt.get(userId) as any;
    const mostCommonMood = moodDistribution.length > 0 ? moodDistribution[0].moodLevel : 'neutral';

    return {
      stats: {
        total_entries: stats?.totalEntries || 0,
        avg_energy: stats?.avgEnergy || 0,
        avg_sleep: stats?.avgSleep || 0,
        avg_stress: stats?.avgStress || 0,
        most_common_mood: mostCommonMood
      },
      mood_distribution: moodDistribution.map((item: any) => ({
        mood_level: item.moodLevel,
        count: item.totalEntries
      })),
      mood_entries: this.getMoodEntriesForUser(userId, days)
    };
  }

  // Get sleep statistics for a user
  getSleepStats(userId: number, days: number = 30) {
    const stmt = this.db.prepare(`
      SELECT 
        AVG(sleepHours) as avgSleep,
        MIN(sleepHours) as minSleep,
        MAX(sleepHours) as maxSleep,
        AVG(energyLevel) as avgEnergy,
        COUNT(*) as totalEntries
      FROM mood_entries
      WHERE userId = ? AND createdAt > datetime(\'now\', \'-${days} days\')
    `);

    const stats = stmt.get(userId) as any;

    const patternStmt = this.db.prepare(`
      SELECT 
        date(createdAt) as date,
        AVG(sleepHours) as sleep_hours,
        AVG(energyLevel) as energy_level
      FROM mood_entries
      WHERE userId = ? AND createdAt > datetime(\'now\', \'-14 days\')
      GROUP BY date(createdAt)
      ORDER BY date DESC
    `);

    const sleepPattern = patternStmt.all(userId);

    return {
      stats: {
        avg_sleep: stats?.avgSleep || 0,
        min_sleep: stats?.minSleep || 0,
        max_sleep: stats?.maxSleep || 0,
        avg_energy: stats?.avgEnergy || 0,
        total_entries: stats?.totalEntries || 0
      },
      sleepPattern
    };
  }

  // Calculate wellness score for a user
  calculateWellnessScore(userId: number, days: number = 7): number {
    const recentEntries = this.getMoodEntriesForUser(userId, days);
    
    if (recentEntries.length === 0) return 50;

    const totalScore = recentEntries.reduce((sum, entry) => {
      const moodScore = this.getMoodScore(entry.moodLevel);
      const energyBonus = (entry.energyLevel - 5) * 2;
      const sleepBonus = entry.sleepHours >= 7 ? 5 : entry.sleepHours >= 6 ? 0 : -5;
      const stressReduction = (10 - entry.stressLevel) * 1;
      
      return sum + moodScore + energyBonus + sleepBonus + stressReduction;
    }, 0);

    const averageScore = totalScore / recentEntries.length;
    return Math.max(0, Math.min(100, Math.round(averageScore)));
  }

  // Calculate mood streaks
  calculateMoodStreak(userId: number): number {
    const entries = this.getMoodEntriesForUser(userId, 365); // Max 365 days
    if (entries.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasEntryForDate = entries.some(entry => {
        const entryDate = new Date(entry.createdAt);
        entryDate.setHours(0, 0, 0, 0);
        return entryDate.getTime() === checkDate.getTime();
      });

      if (hasEntryForDate) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Helper methods for calculations
  private calculateEnergyLevel(moodLevel: string, sleepHours: number, stressLevel: number): number {
    const moodToEnergyMap = {
      'very_low': 2,
      'low': 3,
      'neutral': 5,
      'good': 7,
      'excellent': 9
    };

    const moodEnergy = (moodToEnergyMap as any)[moodLevel] || 5;
    const sleepBonus = sleepHours >= 7 ? 1 : sleepHours >= 6 ? 0 : -1;
    const stressPenalty = stressLevel > 7 ? -1 : stressLevel > 5 ? 0 : 1;

    return Math.max(1, Math.min(10, moodEnergy + sleepBonus + stressPenalty));
  }

  private calculateMoodFromSleep(hours: number, quality: number = 3): 'very_low' | 'low' | 'neutral' | 'good' | 'excellent' {
    let moodScore = 0;

    if (hours >= 7 && hours <= 9) moodScore += 3;
    else if (hours >= 6 && hours <= 10) moodScore += 2;
    else if (hours >= 5 && hours <= 11) moodScore += 1;

    if (quality >= 4) moodScore += 2;
    else if (quality >= 3) moodScore += 1;

    if (moodScore >= 4) return 'excellent';
    if (moodScore >= 3) return 'good';
    if (moodScore >= 2) return 'neutral';
    if (moodScore >= 1) return 'low';
    return 'very_low';
  }

  private calculateEnergyFromSleep(hours: number, quality: number = 3): number {
    let energy = 5;

    if (hours >= 7 && hours <= 9) energy += 3;
    else if (hours >= 6 && hours <= 10) energy += 2;
    else if (hours >= 5 && hours <= 11) energy += 1;
    else if (hours < 5) energy -= 2;
    else energy -= 1;

    energy += (quality - 3);
    return Math.max(1, Math.min(10, energy));
  }

  private calculateStressFromSleep(hours: number, quality: number = 3): number {
    let stress = 5;

    if (hours < 6) stress += 2;
    else if (hours > 10) stress += 1;
    else if (hours >= 7 && hours <= 9) stress -= 1;

    stress += (3 - quality);
    return Math.max(1, Math.min(10, stress));
  }

  private getMoodScore(moodLevel: string): number {
    const moodScores = {
      'very_low': 20,
      'low': 40,
      'neutral': 60,
      'good': 80,
      'excellent': 100
    };

    return (moodScores as any)[moodLevel] || 60;
  }

  // Delete mood entry
  deleteMoodEntry(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM mood_entries WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export const moodModel = new MoodModel();
