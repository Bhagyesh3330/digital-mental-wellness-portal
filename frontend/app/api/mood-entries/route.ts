import { NextResponse } from 'next/server';
import { moodModel } from '@/lib/database/models/mood';

// GET /api/mood-entries - Fetch all mood entries
export async function GET() {
  try {
    // Get all mood entries (for admin or system use)
    const entries: any[] = []; // Not implemented in current model
    return NextResponse.json({ entries });
  } catch (error) {
    console.error('Error fetching mood entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mood entries' },
      { status: 500 }
    );
  }
}

// POST /api/mood-entries - Create a new mood entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, moodLevel, notes, energyLevel, sleepHours, stressLevel } = body;

    // Validate required fields
    if (!userId || !moodLevel || sleepHours === undefined || stressLevel === undefined) {
      return NextResponse.json(
        { error: 'User ID, mood level, sleep hours, and stress level are required' },
        { status: 400 }
      );
    }

    // Validate mood level
    const validMoodLevels = ['very_low', 'low', 'neutral', 'good', 'excellent'];
    if (!validMoodLevels.includes(moodLevel)) {
      return NextResponse.json(
        { error: 'Invalid mood level' },
        { status: 400 }
      );
    }

    // Validate numeric ranges
    if (sleepHours < 0 || sleepHours > 24) {
      return NextResponse.json(
        { error: 'Sleep hours must be between 0 and 24' },
        { status: 400 }
      );
    }

    if (stressLevel < 1 || stressLevel > 10) {
      return NextResponse.json(
        { error: 'Stress level must be between 1 and 10' },
        { status: 400 }
      );
    }

    if (energyLevel !== undefined && (energyLevel < 1 || energyLevel > 10)) {
      return NextResponse.json(
        { error: 'Energy level must be between 1 and 10' },
        { status: 400 }
      );
    }

    // Calculate energy level if not provided
    const calculateEnergyLevel = () => {
      if (energyLevel) return energyLevel;
      
      const moodToEnergyMap = {
        'very_low': 2,
        'low': 3,
        'neutral': 5,
        'good': 7,
        'excellent': 9
      };
      
      const moodEnergy = moodToEnergyMap[moodLevel as keyof typeof moodToEnergyMap];
      const sleepBonus = sleepHours >= 7 ? 1 : sleepHours >= 6 ? 0 : -1;
      const stressPenalty = stressLevel > 7 ? -1 : stressLevel > 5 ? 0 : 1;
      
      return Math.max(1, Math.min(10, moodEnergy + sleepBonus + stressPenalty));
    };

    const result = moodModel.createMoodEntry({
      userId,
      moodLevel,
      energyLevel: calculateEnergyLevel(),
      sleepHours,
      stressLevel,
      notes: notes?.trim() || undefined,
    });

    return NextResponse.json({ entry: result }, { status: 201 });
  } catch (error) {
    console.error('Error creating mood entry:', error);
    return NextResponse.json(
      { error: 'Failed to create mood entry' },
      { status: 500 }
    );
  }
}
