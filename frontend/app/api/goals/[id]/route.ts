import { NextResponse } from 'next/server';
import { goalsModel } from '@/lib/database/models/goals';
import { createGoalCompletionNotification, GoalCompletionData } from '@/lib/utils/notification-triggers';

// GET /api/goals/[id] - Fetch goal by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const goal = goalsModel.getGoalById(id);
    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Error fetching goal:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal' },
      { status: 500 }
    );
  }
}

// PUT /api/goals/[id] - Update goal
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
    
    // Get the goal before update to check if it's being completed
    const originalGoal = goalsModel.getGoalById(id);
    if (!originalGoal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }
    
    const result = goalsModel.updateGoal(id, body);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update goal' },
        { status: 500 }
      );
    }

    const updatedGoal = goalsModel.getGoalById(id);
    
    // Check if goal was just completed (isCompleted changed from false to true)
    if (!originalGoal.isCompleted && updatedGoal && updatedGoal.isCompleted) {
      // Trigger goal completion notification
      const goalCompletionData: GoalCompletionData = {
        userId: updatedGoal.userId,
        goalTitle: updatedGoal.title,
        goalType: 'wellness', // Default type since category isn't stored in the current schema
        completionDate: new Date().toISOString()
      };
      
      // Create notification asynchronously
      createGoalCompletionNotification(goalCompletionData).catch(error => {
        console.error('Failed to create goal completion notification:', error);
      });
    }
    
    return NextResponse.json({ goal: updatedGoal });
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { error: 'Failed to update goal' },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/[id] - Delete goal
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid goal ID' },
        { status: 400 }
      );
    }

    const result = goalsModel.deleteGoal(id);

    if (!result) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { error: 'Failed to delete goal' },
      { status: 500 }
    );
  }
}
