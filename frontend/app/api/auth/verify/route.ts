import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// GET /api/auth/verify - Verify user token
export async function GET(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix

    const user = userModel.getUserFromToken(token);
    
    if (user) {
      // Transform user data to match frontend User interface
      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role as 'student' | 'counselor',
        phone: user.phone,
        hostelName: user.hostelName,
        roomNumber: user.roomNumber,
        course: user.course,
        yearOfStudy: user.yearOfStudy,
        studentId: user.studentId,
        specialization: user.specialization,
        experience: user.experience,
        dateOfBirth: user.dateOfBirth,
        isActive: user.isActive,
        createdAt: user.createdAt
      };

      return NextResponse.json({
        success: true,
        user: userData
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    );
  }
}
