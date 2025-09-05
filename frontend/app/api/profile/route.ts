import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// PUT /api/profile - Update user profile
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

    const body = await request.json();
    const { firstName, lastName, phone, hostelName, roomNumber, profileData } = body;

    // Update basic user fields
    const updates: any = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName) updates.lastName = lastName.trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (hostelName !== undefined) updates.hostelName = hostelName?.trim() || null;
    if (roomNumber !== undefined) updates.roomNumber = roomNumber?.trim() || null;

    // Handle profileData fields
    if (profileData) {
      if (profileData.dateOfBirth !== undefined) {
        updates.dateOfBirth = profileData.dateOfBirth?.trim() || null;
      }
      if (profileData.specialization !== undefined) {
        updates.specialization = profileData.specialization?.trim() || null;
      }
      if (profileData.qualifications !== undefined) {
        updates.qualifications = profileData.qualifications?.trim() || null;
      }
      if (profileData.yearsOfExperience !== undefined) {
        updates.experience = profileData.yearsOfExperience?.toString() || null;
      }
      if (profileData.course !== undefined) {
        updates.course = profileData.course?.trim() || null;
      }
      if (profileData.yearOfStudy !== undefined) {
        updates.yearOfStudy = parseInt(profileData.yearOfStudy?.toString() || '1');
      }
    }

    const success = userModel.updateUser(user.id, updates);
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
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
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
