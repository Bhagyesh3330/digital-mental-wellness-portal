import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// GET /api/profile/student - Get student profile
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

    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied: Student role required' },
        { status: 403 }
      );
    }

    // Return user profile data
    return NextResponse.json(user);
  } catch (error) {
    console.error('Student profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/profile/student - Update student profile
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

    if (user.role !== 'student') {
      return NextResponse.json(
        { error: 'Access denied: Student role required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { firstName, lastName, phone, hostelName, roomNumber, dateOfBirth, course, yearOfStudy } = body;

    // Update student profile fields
    const updates: any = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (hostelName !== undefined) updates.hostelName = hostelName?.trim() || null;
    if (roomNumber !== undefined) updates.roomNumber = roomNumber?.trim() || null;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth?.trim() || null;
    if (course !== undefined) updates.course = course?.trim() || null;
    if (yearOfStudy !== undefined) updates.yearOfStudy = parseInt(yearOfStudy?.toString() || '1');

    const success = userModel.updateUser(user.id, updates);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update student profile' },
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
    console.error('Student profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
