import { NextResponse } from 'next/server';
import { goalsModel } from '@/lib/database/models/goals';

// PUT /api/goals/[id]/progress - Update goal progress
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { progress_percentage, progress_note } = body;

    // Validate progress percentage
    if (typeof progress_percentage !== 'number' || progress_percentage < 0 || progress_percentage > 100) {
      return NextResponse.json(
        { error: 'Progress percentage must be between 0 and 100' },
        { status: 400 }
      );
    }

    const result = goalsModel.updateGoalProgress(id, progress_percentage);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update goal progress or goal not found' },
        { status: 404 }
      );
    }

    const updatedGoal = goalsModel.getGoalById(id);
    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    return NextResponse.json(
      { error: 'Failed to update goal progress' },
      { status: 500 }
    );
  }
}
