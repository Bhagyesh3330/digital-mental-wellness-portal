import { NextResponse } from 'next/server';
import { moodModel } from '@/lib/database/models/mood';

// POST /api/sleep-entries - Create a new sleep entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, sleepHours, sleepQuality, notes } = body;

    // Validate required fields
    if (!userId || sleepHours === undefined) {
      return NextResponse.json(
        { error: 'User ID and sleep hours are required' },
        { status: 400 }
      );
    }

    // Validate sleep hours
    if (sleepHours < 0 || sleepHours > 24) {
      return NextResponse.json(
        { error: 'Sleep hours must be between 0 and 24' },
        { status: 400 }
      );
    }

    // Validate sleep quality if provided
    if (sleepQuality !== undefined && (sleepQuality < 1 || sleepQuality > 5)) {
      return NextResponse.json(
        { error: 'Sleep quality must be between 1 and 5' },
        { status: 400 }
      );
    }

    const result = moodModel.createSleepEntry({
      userId,
      sleepHours,
      sleepQuality: sleepQuality || 3, // Default to 3 if not provided
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ sleepEntry: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating sleep entry:', error);
    return NextResponse.json(
      { error: 'Failed to create sleep entry' },
      { status: 500 }
    );
  }
}
