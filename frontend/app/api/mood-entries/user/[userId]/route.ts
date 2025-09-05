import { NextResponse } from 'next/server';
import { moodModel } from '@/lib/database/models/mood';

// GET /api/mood-entries/user/[userId] - Fetch mood entries by user ID
export async function GET(
  request: Request, 
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const limit = url.searchParams.get('limit');
    const limitNum = limit ? parseInt(limit) : undefined;

    const entries = moodModel.getMoodEntriesForUser(userId, limitNum);
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching user mood entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user mood entries' },
      { status: 500 }
    );
  }
}
