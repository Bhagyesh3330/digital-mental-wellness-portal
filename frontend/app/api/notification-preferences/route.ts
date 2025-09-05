import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

export interface NotificationPreferences {
  id?: number;
  userId: number;
  enableWellnessScoreNotifications: boolean;
  enableGoalCompletionNotifications: boolean;
  enableStreakNotifications: boolean;
  enableMoodPatternNotifications: boolean;
  enableDailyReminders: boolean;
  reminderTime: string; // HH:MM format
  emailNotifications: boolean;
  pushNotifications: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  minScoreChangeThreshold: number;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
  };
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
  enableWellnessScoreNotifications: true,
  enableGoalCompletionNotifications: true,
  enableStreakNotifications: true,
  enableMoodPatternNotifications: true,
  enableDailyReminders: false,
  reminderTime: '20:00',
  emailNotifications: false,
  pushNotifications: true,
  frequency: 'immediate',
  minScoreChangeThreshold: 5,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  }
};

// GET /api/notification-preferences - Get user's notification preferences
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = userModel.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // For now, return default preferences since we haven't implemented storage yet
    // In a real implementation, you'd fetch from a database table
    const preferences: NotificationPreferences = {
      id: 1,
      userId: user.id,
      ...DEFAULT_PREFERENCES,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

// PUT /api/notification-preferences - Update user's notification preferences
export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const user = userModel.getUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate the preferences
    const updates: Partial<NotificationPreferences> = {};
    
    if (typeof body.enableWellnessScoreNotifications === 'boolean') {
      updates.enableWellnessScoreNotifications = body.enableWellnessScoreNotifications;
    }
    if (typeof body.enableGoalCompletionNotifications === 'boolean') {
      updates.enableGoalCompletionNotifications = body.enableGoalCompletionNotifications;
    }
    if (typeof body.enableStreakNotifications === 'boolean') {
      updates.enableStreakNotifications = body.enableStreakNotifications;
    }
    if (typeof body.enableMoodPatternNotifications === 'boolean') {
      updates.enableMoodPatternNotifications = body.enableMoodPatternNotifications;
    }
    if (typeof body.enableDailyReminders === 'boolean') {
      updates.enableDailyReminders = body.enableDailyReminders;
    }
    if (typeof body.reminderTime === 'string' && /^\d{2}:\d{2}$/.test(body.reminderTime)) {
      updates.reminderTime = body.reminderTime;
    }
    if (typeof body.emailNotifications === 'boolean') {
      updates.emailNotifications = body.emailNotifications;
    }
    if (typeof body.pushNotifications === 'boolean') {
      updates.pushNotifications = body.pushNotifications;
    }
    if (['immediate', 'daily', 'weekly'].includes(body.frequency)) {
      updates.frequency = body.frequency;
    }
    if (typeof body.minScoreChangeThreshold === 'number' && body.minScoreChangeThreshold >= 1 && body.minScoreChangeThreshold <= 50) {
      updates.minScoreChangeThreshold = body.minScoreChangeThreshold;
    }
    if (body.quietHours && typeof body.quietHours === 'object') {
      updates.quietHours = {
        enabled: typeof body.quietHours.enabled === 'boolean' ? body.quietHours.enabled : false,
        startTime: typeof body.quietHours.startTime === 'string' && /^\d{2}:\d{2}$/.test(body.quietHours.startTime) 
          ? body.quietHours.startTime : '22:00',
        endTime: typeof body.quietHours.endTime === 'string' && /^\d{2}:\d{2}$/.test(body.quietHours.endTime) 
          ? body.quietHours.endTime : '08:00'
      };
    }

    // For now, just return the updated preferences
    // In a real implementation, you'd save to database
    const updatedPreferences: NotificationPreferences = {
      id: 1,
      userId: user.id,
      ...DEFAULT_PREFERENCES,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({ 
      preferences: updatedPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
