import { NextResponse } from 'next/server';
import { Notification } from '@/lib/models/Notification';
import { userModel } from '@/lib/database/models/users';

// GET /api/notifications - Fetch notifications for authenticated user
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

    // Get query parameters
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const limitNum = limit ? parseInt(limit) : 50;

    const notifications = await Notification.findByUserId(user.id, limitNum);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification (authenticated)
export async function POST(request: Request) {
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
    const { type, title, message, previous_score, current_score, score_change, priority, target_user_id } = body;

    // Use authenticated user's ID unless target_user_id is provided (for admin/counselor features)
    const userId = target_user_id || user.id;

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      );
    }

    // Validate notification type
    const validTypes = ['wellness_score_change', 'mood_milestone', 'streak_achievement', 'improvement', 'decline', 'milestone', 'alert'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !['low', 'medium', 'high'].includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority level' },
        { status: 400 }
      );
    }

    const result = await Notification.create({
      user_id: userId,
      type,
      title: title.trim(),
      message: message.trim(),
      previous_score,
      current_score,
      score_change,
      priority: priority || 'low',
    });

    if (!result.success || !result.notification) {
      return NextResponse.json(
        { error: result.error || 'Failed to create notification' },
        { status: 400 }
      );
    }

    return NextResponse.json({ notification: result.notification }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
