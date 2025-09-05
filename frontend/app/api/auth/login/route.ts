import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// POST /api/auth/login - User login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const result = userModel.authenticateUser(email, password);

    if (result.success && result.user && result.token) {
      // Transform user data to match frontend User interface
      const userData = {
        id: result.user.id,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        role: result.user.role as 'student' | 'counselor',
        phone: result.user.phone,
        hostelName: result.user.hostelName,
        roomNumber: result.user.roomNumber,
        course: result.user.course,
        yearOfStudy: result.user.yearOfStudy,
        studentId: result.user.studentId,
        specialization: result.user.specialization,
        experience: result.user.experience,
        dateOfBirth: result.user.dateOfBirth,
        isActive: result.user.isActive,
        createdAt: result.user.createdAt
      };

      return NextResponse.json({
        success: true,
        user: userData,
        token: result.token
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid credentials' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
