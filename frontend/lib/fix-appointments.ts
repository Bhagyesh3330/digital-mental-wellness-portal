// Comprehensive script to fix appointment system and add notifications

import { 
  getUserAppointments, 
  getAllCounselors, 
  getAllStudents, 
  createAppointment, 
  updateAppointmentStatus,
  type AppointmentData,
  type CounselorData,
  type StudentData,
  type CreateAppointmentRequest
} from './api/appointments-new';

// Test the appointment system
export const testAppointmentSystem = async () => {
  if (typeof window === 'undefined') return;
  
  console.group('🗓️ TESTING APPOINTMENT SYSTEM');
  
  try {
    // Test 1: Fetch counselors
    console.log('Step 1: Testing counselors API...');
    const counselors = await getAllCounselors();
    console.log(`✅ Found ${counselors.length} counselors:`, counselors);
    
    // Test 2: Fetch students  
    console.log('\nStep 2: Testing students API...');
    const students = await getAllStudents();
    console.log(`✅ Found ${students.length} students:`, students);
    
    // Test 3: Create test appointment if we have data
    if (counselors.length > 0 && students.length > 0) {
      console.log('\nStep 3: Testing appointment creation...');
      
      const testAppointment: CreateAppointmentRequest = {
        studentId: students[0].id,
        counselorId: counselors[0].id,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        durationMinutes: 60,
        reason: 'Test appointment created by system check'
      };
      
      const createResult = await createAppointment(testAppointment);
      console.log('Appointment creation result:', createResult);
      
      if (createResult.success && createResult.appointment) {
        console.log('✅ Test appointment created successfully!');
        
        // Test notifications
        await createNotification(
          createResult.appointment.studentId,
          'appointment_booked',
          'Appointment Booked',
          `Your appointment with ${createResult.appointment.counselorFirstName} ${createResult.appointment.counselorLastName} has been scheduled.`,
          createResult.appointment.id
        );
        
        await createNotification(
          createResult.appointment.counselorId,
          'appointment_booked',
          'New Appointment',
          `New appointment booked with ${createResult.appointment.studentFirstName} ${createResult.appointment.studentLastName}.`,
          createResult.appointment.id
        );
        
        console.log('✅ Test notifications sent');
      }
    } else {
      console.log('⚠️  Cannot test appointment creation - no counselors or students found');
    }
    
  } catch (error) {
    console.error('Error during appointment system test:', error);
  }
  
  console.groupEnd();
};

// Create notification helper
export const createNotification = async (
  userId: number,
  type: string,
  title: string,
  message: string,
  appointmentId?: number
) => {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer dummy-token` // You might need to handle auth properly
      },
      body: JSON.stringify({
        type,
        title,
        message,
        target_user_id: userId,
        appointment_id: appointmentId
      })
    });
    
    if (!response.ok) {
      console.error('Failed to create notification:', await response.text());
    }
    
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Create test data for appointments
export const createAppointmentTestData = async () => {
  console.log('🧪 Creating appointment test data...');
  
  try {
    // Create test counselor
    const counselorResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'appointment.counselor@test.com',
        password: 'password123',
        firstName: 'Dr. Sarah',
        lastName: 'Wilson',
        role: 'counselor',
        specialization: 'Clinical Psychology',
        experience: '10+ years',
        phone: '+1234567892',
        profileData: {
          licenseNumber: 'LIC789012',
          qualifications: 'PhD Clinical Psychology, Licensed Therapist'
        }
      })
    });
    
    const counselorData = await counselorResponse.json();
    if (counselorData.success) {
      console.log('✅ Test counselor created:', counselorData.user.firstName, counselorData.user.lastName);
    }
    
    // Create test student
    const studentResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'appointment.student@test.com',
        password: 'password123',
        firstName: 'Alex',
        lastName: 'Johnson',
        role: 'student',
        course: 'Psychology',
        yearOfStudy: 3,
        phone: '+1234567893',
        hostelName: 'Main Hostel',
        roomNumber: '302'
      })
    });
    
    const studentData = await studentResponse.json();
    if (studentData.success) {
      console.log('✅ Test student created:', studentData.user.firstName, studentData.user.lastName);
    }
    
    return {
      counselor: counselorData.success ? counselorData.user : null,
      student: studentData.success ? studentData.user : null
    };
    
  } catch (error) {
    console.error('Error creating appointment test data:', error);
    return { counselor: null, student: null };
  }
};

// Complete appointment system setup and test
export const setupAppointmentSystem = async () => {
  console.log('🚀 Setting up complete appointment system...\n');
  
  // Step 1: Create test data
  console.log('='.repeat(50));
  const testData = await createAppointmentTestData();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Test the system
  console.log('\n' + '='.repeat(50));
  await testAppointmentSystem();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Appointment system setup complete!');
  console.log('📋 Now you can:');
  console.log('   1. Login as counselor: appointment.counselor@test.com / password123');
  console.log('   2. Login as student: appointment.student@test.com / password123');
  console.log('   3. Book appointments between them');
  console.log('   4. Check notifications for real-time updates');
  console.log('   5. View appointments in both dashboards');
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).testAppointmentSystem = testAppointmentSystem;
  (window as any).createAppointmentTestData = createAppointmentTestData;
  (window as any).setupAppointmentSystem = setupAppointmentSystem;
  (window as any).createNotification = createNotification;
  
  console.log('');
  console.log('🗓️ APPOINTMENT SYSTEM TOOLS LOADED:');
  console.log('🧪 testAppointmentSystem() - Test all appointment APIs');
  console.log('👥 createAppointmentTestData() - Create test counselor & student');
  console.log('🚀 setupAppointmentSystem() - Complete setup & test');
  console.log('🔔 createNotification(userId, type, title, message) - Send notification');
  console.log('');
}
