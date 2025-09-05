import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';

// POST /api/auth/logout - User logout
export async function POST(request: Request) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authorization.substring(7); // Remove 'Bearer ' prefix

    userModel.logoutUser(token);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
