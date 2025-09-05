import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// POST /api/auth/register - User registration
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Registration request body:', body);
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      phone, 
      hostelName, 
      roomNumber,
      course,
      yearOfStudy,
      dateOfBirth,
      specialization,
      experience,
      profileData
    } = body;
    
    // Extract license number and qualifications from profileData if present
    const licenseNumber = profileData?.licenseNumber;
    const qualifications = profileData?.qualifications;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, first name, last name, and role are required' },
        { status: 400 }
      );
    }

    // Filter out admin role - only allow student and counselor
    const allowedRole = role === 'admin' ? 'counselor' : role;
    if (!['student', 'counselor'].includes(allowedRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Only student and counselor are allowed.' },
        { status: 400 }
      );
    }
    
    // Validate counselor-specific required fields
    if (allowedRole === 'counselor') {
      if (!specialization) {
        return NextResponse.json(
          { success: false, error: 'Specialization is required for counselors' },
          { status: 400 }
        );
      }
      if (!experience) {
        return NextResponse.json(
          { success: false, error: 'Experience is required for counselors' },
          { status: 400 }
        );
      }
      if (!licenseNumber) {
        return NextResponse.json(
          { success: false, error: 'License number is required for counselors' },
          { status: 400 }
        );
      }
      if (!qualifications) {
        return NextResponse.json(
          { success: false, error: 'Qualifications are required for counselors' },
          { status: 400 }
        );
      }
    }

    // Try to create the user
    let result;
    try {
      result = userModel.createUser({
        email,
        firstName,
        lastName,
        role: allowedRole as 'student' | 'counselor',
        phone,
        hostelName,
        roomNumber,
        course,
        yearOfStudy,
        dateOfBirth,
        specialization,
        experience,
        licenseNumber,
        qualifications
      });
    } catch (userError: any) {
      console.error('User creation error:', userError);
      return NextResponse.json(
        { success: false, error: userError.message || 'User creation failed' },
        { status: 400 }
      );
    }

    if (result) {
      // Automatically log in the user after registration
      const loginResult = userModel.authenticateUser(email, password);
      
      if (loginResult.success && loginResult.user && loginResult.token) {
        const userData = {
          id: loginResult.user.id,
          firstName: loginResult.user.firstName,
          lastName: loginResult.user.lastName,
          email: loginResult.user.email,
          role: loginResult.user.role as 'student' | 'counselor',
          phone: loginResult.user.phone,
          hostelName: loginResult.user.hostelName,
          roomNumber: loginResult.user.roomNumber,
          course: loginResult.user.course,
          yearOfStudy: loginResult.user.yearOfStudy,
          studentId: loginResult.user.studentId,
          specialization: loginResult.user.specialization,
          experience: loginResult.user.experience,
          licenseNumber: loginResult.user.licenseNumber,
          qualifications: loginResult.user.qualifications,
          dateOfBirth: loginResult.user.dateOfBirth,
          isActive: loginResult.user.isActive,
          createdAt: loginResult.user.createdAt
        };

        return NextResponse.json({
          success: true,
          user: userData,
          token: loginResult.token
        }, { status: 201 });
      } else {
        console.error('Authentication failed after registration:', loginResult.error);
        return NextResponse.json(
          { success: false, error: 'Registration successful but login failed. Please try logging in manually.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}
