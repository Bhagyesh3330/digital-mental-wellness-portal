import { NextResponse } from 'next/server';
import { userModel } from '@/lib/database/models/users';
import { appointmentModel } from '@/lib/database/models/appointments';

interface AnalyticsStats {
  // Student Statistics
  totalStudents: number;
  activeStudents: number; // Students with recent activity
  studentsAtRisk: number; // Students with wellness score < 50
  
  // Session Statistics
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  scheduledSessions: number;
  completionRate: number; // Percentage of completed sessions
  
  // Wellness Statistics
  averageWellnessScore: number;
  averageMoodRating: number; // 1-5 scale
  totalMoodEntries: number;
  
  // Resource Statistics
  totalResources: number;
  resourcesByType: {
    article: number;
    video: number;
    book: number;
    worksheet: number;
    reference: number;
  };
  
  // Time-based statistics
  lastUpdated: string;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
}

// GET /api/analytics - Get real-time analytics statistics
export async function GET(request: Request) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = userModel.getUserFromToken(token);
      
      if (!user || user.role !== 'counselor') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Counselor access required' },
          { status: 401 }
        );
      }
    } else {
      // For now, allow public access to analytics for testing
      console.log('No auth token provided, allowing public access for testing');
    }
    
    console.log('Fetching real-time analytics from database...');
    
    // Get all users
    const allUsers = userModel.getAllUsers();
    const students = allUsers.filter(user => user.role === 'student');
    const counselors = allUsers.filter(user => user.role === 'counselor');
    
    // Get all appointments (using the correct method signature)
    const allAppointments = userModel.getAllUsers().reduce((appointments: any[], user) => {
      if (user.role === 'counselor') {
        const counselorAppointments = appointmentModel.getAppointmentsForUser(user.id, 'counselor');
        appointments.push(...counselorAppointments);
      }
      return appointments;
    }, []);
    
    // Remove duplicate appointments (in case they were fetched multiple times)
    const uniqueAppointments = allAppointments.reduce((unique: any[], apt: any) => {
      if (!unique.find(u => u.id === apt.id)) {
        unique.push(apt);
      }
      return unique;
    }, []);
    
    // Calculate date ranges for activity
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Student Statistics
    const totalStudents = students.length;
    
    // Count active students (those with appointments in last 30 days)
    const activeStudentIds = new Set();
    const weeklyActiveIds = new Set();
    const monthlyActiveIds = new Set();
    
    uniqueAppointments.forEach(apt => {
      const aptDate = new Date(apt.createdAt);
      if (aptDate >= thirtyDaysAgo) {
        activeStudentIds.add(apt.studentId);
        monthlyActiveIds.add(apt.studentId);
      }
      if (aptDate >= sevenDaysAgo) {
        weeklyActiveIds.add(apt.studentId);
      }
    });
    
    const activeStudents = activeStudentIds.size;
    const weeklyActiveUsers = weeklyActiveIds.size;
    const monthlyActiveUsers = monthlyActiveIds.size;
    
    // For now, assume students at risk = 0 (would need mood data to calculate)
    const studentsAtRisk = 0;
    
    // Session Statistics
    const totalSessions = uniqueAppointments.length;
    const completedSessions = uniqueAppointments.filter(apt => apt.status === 'completed').length;
    const cancelledSessions = uniqueAppointments.filter(apt => apt.status === 'cancelled').length;
    const scheduledSessions = uniqueAppointments.filter(apt => apt.status === 'scheduled').length;
    
    const completionRate = totalSessions > 0 
      ? Math.round((completedSessions / totalSessions) * 100) 
      : 0;
    
    // Wellness Statistics (placeholder values)
    const averageWellnessScore = 50; // Would need mood data
    const averageMoodRating = 3.0; // Would need mood data
    const totalMoodEntries = 0; // Would need mood data
    
    // Resource Statistics (fetch from database)
    const { Resource } = require('@/lib/models/Resource');
    let totalResources = 0;
    let resourcesByType = {
      article: 0,
      video: 0,
      book: 0,
      worksheet: 0,
      reference: 0
    };
    
    try {
      const allResources = await Resource.findAll();
      totalResources = allResources.length;
      
      // Count resources by type
      allResources.forEach((resource: any) => {
        if (resourcesByType.hasOwnProperty(resource.type)) {
          resourcesByType[resource.type as keyof typeof resourcesByType]++;
        }
      });
    } catch (error) {
      console.log('Could not fetch resources for analytics, using defaults');
    }
    
    const stats: AnalyticsStats = {
      totalStudents,
      activeStudents,
      studentsAtRisk,
      totalSessions,
      completedSessions,
      cancelledSessions,
      scheduledSessions,
      completionRate,
      averageWellnessScore,
      averageMoodRating,
      totalMoodEntries,
      totalResources,
      resourcesByType,
      lastUpdated: new Date().toISOString(),
      weeklyActiveUsers,
      monthlyActiveUsers
    };
    
    console.log('Analytics stats calculated:', {
      totalStudents: stats.totalStudents,
      totalSessions: stats.totalSessions,
      completionRate: stats.completionRate,
      activeStudents: stats.activeStudents
    });
    
    return NextResponse.json({
      success: true,
      analytics: stats
    });
    
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
