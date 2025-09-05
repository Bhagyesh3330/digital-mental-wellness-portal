import { NextResponse } from 'next/server';
import { Notification } from '@/lib/models/Notification';
import { userModel } from '@/lib/database/models/users';

// GET /api/notifications/user/[userId] - Fetch notifications by user ID (authenticated)
export async function GET(request: Request, { params }: { params: { userId: string } }) {
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

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Users can only access their own notifications unless they are counselors
    if (user.id !== userId && user.role !== 'counselor') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const limitNum = limit ? parseInt(limit) : undefined;

    const notifications = await Notification.findByUserId(userId, limitNum);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user notifications' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/user/[userId] - Mark all notifications as read for user (authenticated)
export async function PUT(request: Request, { params }: { params: { userId: string } }) {
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

    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Users can only modify their own notifications unless they are counselors
    if (user.id !== userId && user.role !== 'counselor') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const result = await Notification.markAllAsRead(userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to mark notifications as read' },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
