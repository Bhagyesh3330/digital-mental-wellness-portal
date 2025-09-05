import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// GET /api/profile/counselor - Get counselor profile
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

    if (user.role !== 'counselor') {
      return NextResponse.json(
        { error: 'Access denied: Counselor role required' },
        { status: 403 }
      );
    }

    // Return user profile data
    return NextResponse.json(user);
  } catch (error) {
    console.error('Counselor profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/counselor - Update counselor profile
export async function PUT(request: Request) {
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

    if (user.role !== 'counselor') {
      return NextResponse.json(
        { error: 'Access denied: Counselor role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, specialization, qualifications, yearsOfExperience } = body;

    // Update counselor profile fields
    const updates: any = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (specialization !== undefined) updates.specialization = specialization?.trim() || null;
    if (qualifications !== undefined) updates.qualifications = qualifications?.trim() || null;
    if (yearsOfExperience !== undefined) updates.experience = yearsOfExperience?.toString() || null;

    const success = userModel.updateUser(user.id, updates);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update counselor profile' },
        { status: 500 }
      );
    }

    // Return updated user data
    const updatedUser = userModel.getUserById(user.id);
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'Failed to fetch updated profile' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Counselor profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
