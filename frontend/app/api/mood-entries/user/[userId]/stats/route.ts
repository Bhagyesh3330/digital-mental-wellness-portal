import { NextResponse } from 'next/server';
import { moodModel } from '@/lib/database/models/mood';

// GET /api/mood-entries/user/[userId]/stats - Get mood/sleep statistics for a user
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const type = url.searchParams.get('type') || 'mood';

    if (type === 'sleep') {
      const sleepStats = moodModel.getSleepStats(userId, days);
      return NextResponse.json(sleepStats);
    } else {
      const moodStats = moodModel.getMoodStats(userId, days);
      return NextResponse.json(moodStats);
    }
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}
