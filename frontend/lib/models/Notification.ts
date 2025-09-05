import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'wellness.db');

export interface NotificationData {
  id: number;
  user_id: number;
  type: 'wellness_score_change' | 'mood_milestone' | 'streak_achievement' | 'improvement' | 'decline' | 'milestone' | 'alert';
  title: string;
  message: string;
  previous_score?: number | null;
  current_score?: number | null;
  score_change?: number | null;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  user_id: number;
  type: 'wellness_score_change' | 'mood_milestone' | 'streak_achievement' | 'improvement' | 'decline' | 'milestone' | 'alert';
  title: string;
  message: string;
  previous_score?: number;
  current_score?: number;
  score_change?: number;
  priority?: 'low' | 'medium' | 'high';
}

export interface NotificationResult {
  success: boolean;
  notification?: NotificationData;
  error?: string;
}

export interface NotificationsResult {
  success: boolean;
  notifications?: NotificationData[];
  error?: string;
}

export class Notification {
  private static getDb() {
    return new Database(dbPath);
  }

  // Create a new notification
  static async create(data: CreateNotificationData): Promise<NotificationResult> {
    const db = this.getDb();
    
    try {
      // Validate required fields
      if (!data.user_id || !data.title?.trim() || !data.message?.trim()) {
        return { success: false, error: 'User ID, title, and message are required' };
      }

      const validTypes = ['wellness_score_change', 'mood_milestone', 'streak_achievement', 'improvement', 'decline', 'milestone', 'alert'];
      if (!validTypes.includes(data.type)) {
        return { success: false, error: 'Invalid notification type' };
      }

      const validPriorities = ['low', 'medium', 'high'];
      const priority = data.priority || 'low';
      if (!validPriorities.includes(priority)) {
        return { success: false, error: 'Invalid priority level' };
      }

      const stmt = db.prepare(`
        INSERT INTO notifications (
          user_id, type, title, message, previous_score, current_score, 
          score_change, is_read, priority, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();

      const result = stmt.run(
        data.user_id,
        data.type,
        data.title.trim(),
        data.message.trim(),
        data.previous_score || null,
        data.current_score || null,
        data.score_change || null,
        0, // is_read: false
        priority,
        now,
        now
      );

      // Fetch the created notification
      const newNotification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid) as NotificationData;

      db.close();
      return { success: true, notification: newNotification };
    } catch (error) {
      console.error('Error creating notification:', error);
      db.close();
      return { success: false, error: 'Failed to create notification' };
    }
  }

  // Find all notifications
  static async findAll(): Promise<NotificationData[]> {
    const db = this.getDb();
    
    try {
      const notifications = db.prepare(`
        SELECT * FROM notifications 
        ORDER BY created_at DESC
      `).all() as NotificationData[];
      
      db.close();
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      db.close();
      return [];
    }
  }

  // Find notifications by user ID
  static async findByUserId(userId: number, limit?: number): Promise<NotificationData[]> {
    const db = this.getDb();
    
    try {
      let sql = `
        SELECT * FROM notifications 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `;
      
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const notifications = db.prepare(sql).all(userId) as NotificationData[];
      
      db.close();
      return notifications;
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      db.close();
      return [];
    }
  }

  // Find notification by ID
  static async findById(id: number): Promise<NotificationData | null> {
    const db = this.getDb();
    
    try {
      const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as NotificationData;
      db.close();
      return notification || null;
    } catch (error) {
      console.error('Error fetching notification by ID:', error);
      db.close();
      return null;
    }
  }

  // Mark notification as read
  static async markAsRead(id: number): Promise<NotificationResult> {
    const db = this.getDb();
    
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET is_read = 1, updated_at = ?
        WHERE id = ?
      `);

      const result = stmt.run(new Date().toISOString(), id);

      if (result.changes === 0) {
        db.close();
        return { success: false, error: 'Notification not found' };
      }

      const updatedNotification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as NotificationData;

      db.close();
      return { success: true, notification: updatedNotification };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      db.close();
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: number): Promise<{ success: boolean; error?: string }> {
    const db = this.getDb();
    
    try {
      const stmt = db.prepare(`
        UPDATE notifications 
        SET is_read = 1, updated_at = ?
        WHERE user_id = ? AND is_read = 0
      `);

      stmt.run(new Date().toISOString(), userId);

      db.close();
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      db.close();
      return { success: false, error: 'Failed to mark all notifications as read' };
    }
  }

  // Get unread notification count for user
  static async getUnreadCount(userId: number): Promise<number> {
    const db = this.getDb();
    
    try {
      const result = db.prepare(`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ? AND is_read = 0
      `).get(userId) as { count: number };
      
      db.close();
      return result.count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      db.close();
      return 0;
    }
  }

  // Delete notification
  static async delete(id: number): Promise<{ success: boolean; error?: string }> {
    const db = this.getDb();
    
    try {
      const stmt = db.prepare('DELETE FROM notifications WHERE id = ?');
      const result = stmt.run(id);

      db.close();

      if (result.changes === 0) {
        return { success: false, error: 'Notification not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting notification:', error);
      db.close();
      return { success: false, error: 'Failed to delete notification' };
    }
  }

  // Delete old notifications (older than specified days)
  static async deleteOldNotifications(olderThanDays: number = 30): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
    const db = this.getDb();
    
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const stmt = db.prepare('DELETE FROM notifications WHERE created_at < ?');
      const result = stmt.run(cutoffDate.toISOString());

      db.close();
      return { success: true, deletedCount: result.changes };
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      db.close();
      return { success: false, error: 'Failed to delete old notifications' };
    }
  }

  // Get notifications by type for user
  static async findByUserIdAndType(userId: number, type: string, limit?: number): Promise<NotificationData[]> {
    const db = this.getDb();
    
    try {
      let sql = `
        SELECT * FROM notifications 
        WHERE user_id = ? AND type = ? 
        ORDER BY created_at DESC
      `;
      
      if (limit) {
        sql += ` LIMIT ${limit}`;
      }

      const notifications = db.prepare(sql).all(userId, type) as NotificationData[];
      
      db.close();
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications by user and type:', error);
      db.close();
      return [];
    }
  }

  // Get wellness score tracking state for user
  static async getWellnessState(userId: number): Promise<{ lastScore: number | null; lastNotificationDate: string | null }> {
    const db = this.getDb();
    
    try {
      const result = db.prepare(`
        SELECT current_score, created_at
        FROM notifications 
        WHERE user_id = ? AND type IN ('wellness_score_change', 'improvement', 'decline', 'milestone')
        ORDER BY created_at DESC 
        LIMIT 1
      `).get(userId) as { current_score: number; created_at: string } | undefined;
      
      db.close();
      
      if (result) {
        return { 
          lastScore: result.current_score, 
          lastNotificationDate: result.created_at 
        };
      }
      
      return { lastScore: null, lastNotificationDate: null };
    } catch (error) {
      console.error('Error getting wellness state:', error);
      db.close();
      return { lastScore: null, lastNotificationDate: null };
    }
  }
}
