import { getDatabase } from '../connection';

export interface DatabaseWellnessGoal {
  id: number;
  userId: number;
  title: string;
  description?: string;
  targetDate?: string;
  isCompleted: boolean;
  progressPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalData {
  userId: number;
  title: string;
  description?: string;
  targetDate?: string;
}

export interface UpdateProgressData {
  progressPercentage: number;
  progressNote?: string;
}

class GoalsModel {
  private db = getDatabase();

  // Get goals by user ID
  getGoalsByUserId(userId: number): DatabaseWellnessGoal[] {
    const stmt = this.db.prepare('SELECT * FROM wellness_goals WHERE userId = ? ORDER BY createdAt DESC');
    return stmt.all(userId) as DatabaseWellnessGoal[];
  }

  // Get goal by ID
  getGoalById(id: number): DatabaseWellnessGoal | null {
    const stmt = this.db.prepare('SELECT * FROM wellness_goals WHERE id = ?');
    const result = stmt.get(id) as DatabaseWellnessGoal;
    return result || null;
  }

  // Create goal
  createGoal(goalData: CreateGoalData): DatabaseWellnessGoal {
    // Validate required fields
    if (!goalData.title || goalData.title.trim().length === 0) {
      throw new Error('Goal title is required');
    }
    
    if (goalData.title.length < 3) {
      throw new Error('Title must be at least 3 characters');
    }
    
    if (goalData.title.length > 200) {
      throw new Error('Title must not exceed 200 characters');
    }

    const stmt = this.db.prepare(`
      INSERT INTO wellness_goals (userId, title, description, targetDate)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      goalData.userId,
      goalData.title.trim(),
      goalData.description?.trim() || null,
      goalData.targetDate || null
    );

    const newGoal = this.getGoalById(result.lastInsertRowid as number);
    if (!newGoal) {
      throw new Error('Failed to create goal');
    }

    console.log(`Goal created: "${newGoal.title}" for user ${newGoal.userId}`);
    return newGoal;
  }

  // Update goal progress
  updateGoalProgress(goalId: number, progressPercentage: number): boolean {
    if (progressPercentage < 0 || progressPercentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }

    const isCompleted = progressPercentage >= 100;

    const stmt = this.db.prepare(`
      UPDATE wellness_goals 
      SET progressPercentage = ?, isCompleted = ?, updatedAt = ?
      WHERE id = ?
    `);

    const result = stmt.run(progressPercentage, isCompleted ? 1 : 0, new Date().toISOString(), goalId);
    
    if (result.changes > 0) {
      console.log(`Goal ${goalId} progress updated to ${progressPercentage}%`);
    }
    
    return result.changes > 0;
  }

  // Update goal details
  updateGoal(goalId: number, updates: Partial<DatabaseWellnessGoal>): boolean {
    const goal = this.getGoalById(goalId);
    if (!goal) {
      return false;
    }

    const allowedFields = ['title', 'description', 'targetDate', 'progressPercentage', 'isCompleted'];
    const fields = Object.keys(updates).filter(key => allowedFields.includes(key));
    
    if (fields.length === 0) {
      return false;
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(new Date().toISOString()); // updatedAt
    values.push(goalId); // WHERE clause

    const stmt = this.db.prepare(`
      UPDATE wellness_goals 
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  // Mark goal as completed
  markGoalCompleted(goalId: number): boolean {
    return this.updateGoalProgress(goalId, 100);
  }

  // Delete goal
  deleteGoal(goalId: number): boolean {
    const stmt = this.db.prepare('DELETE FROM wellness_goals WHERE id = ?');
    const result = stmt.run(goalId);
    return result.changes > 0;
  }

  // Get goal statistics for a user
  getGoalStats(userId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isCompleted = 1 THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN isCompleted = 0 AND (targetDate IS NULL OR targetDate >= date(\'now\')) THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN isCompleted = 0 AND targetDate < date(\'now\') THEN 1 ELSE 0 END) as overdue,
        AVG(progressPercentage) as averageProgress,
        SUM(CASE WHEN updatedAt > datetime(\'now\', \'-7 days\') THEN 1 ELSE 0 END) as recentlyUpdated
      FROM wellness_goals
      WHERE userId = ?
    `);

    const result = stmt.get(userId) as any;
    return {
      total: result?.total || 0,
      completed: result?.completed || 0,
      inProgress: result?.inProgress || 0,
      overdue: result?.overdue || 0,
      averageProgress: Math.round(result?.averageProgress || 0),
      recentlyUpdated: result?.recentlyUpdated || 0
    };
  }

  // Get all goals (for system statistics)
  getAllGoals(): DatabaseWellnessGoal[] {
    const stmt = this.db.prepare('SELECT * FROM wellness_goals ORDER BY createdAt DESC');
    return stmt.all() as DatabaseWellnessGoal[];
  }
}

export const goalsModel = new GoalsModel();
