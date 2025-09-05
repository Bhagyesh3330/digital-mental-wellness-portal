import { NextResponse } from 'next/server';
import { goalsModel } from '@/lib/database/models/goals';

// GET /api/goals - Fetch all goals
export async function GET() {
  try {
    const goals = goalsModel.getAllGoals();
    return NextResponse.json({ goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goals' },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new goal
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, description, target_date } = body;

    // Validate required fields
    if (!userId || !title) {
      return NextResponse.json(
        { error: 'User ID and title are required' },
        { status: 400 }
      );
    }

    if (title.trim().length < 3) {
      return NextResponse.json(
        { error: 'Title must be at least 3 characters' },
        { status: 400 }
      );
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title must not exceed 200 characters' },
        { status: 400 }
      );
    }

    const result = goalsModel.createGoal({
      userId,
      title: title.trim(),
      description: description?.trim() || null,
      targetDate: target_date || null,
    });
    return NextResponse.json({ goal: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
