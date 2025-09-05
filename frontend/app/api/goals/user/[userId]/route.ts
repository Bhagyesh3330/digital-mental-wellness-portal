import { NextResponse } from 'next/server';
import { goalsModel } from '@/lib/database/models/goals';

// GET /api/goals/user/[userId] - Fetch goals by user ID
export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = parseInt(params.userId);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const goals = goalsModel.getGoalsByUserId(userId);
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching user goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user goals' },
      { status: 500 }
    );
  }
}
