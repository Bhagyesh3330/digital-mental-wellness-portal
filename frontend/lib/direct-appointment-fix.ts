// Direct appointment system fix - works immediately in console

// Test API endpoints directly
export const testAPIs = async () => {
  console.log('🔍 Testing API endpoints...');
  
  try {
    // Test students API
    console.log('Testing /api/students...');
    const studentsResponse = await fetch('/api/students');
    const studentsData = await studentsResponse.json();
    console.log('Students API response:', studentsData);
    
    // Test counselors API
    console.log('Testing /api/counselors...');
    const counselorsResponse = await fetch('/api/counselors');
    const counselorsData = await counselorsResponse.json();
    console.log('Counselors API response:', counselorsData);
    
    return {
      students: studentsData,
      counselors: counselorsData
    };
    
  } catch (error) {
    console.error('API test failed:', error);
    return null;
  }
};

// Create test users directly
export const createTestUsers = async () => {
  console.log('👥 Creating test users...');
  
  try {
    // Create counselor
    const counselorResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.counselor.fix@example.com',
        password: 'password123',
        firstName: 'Dr. Test',
        lastName: 'Counselor',
        role: 'counselor',
        specialization: 'Clinical Psychology',
        experience: '5+ years',
        phone: '+1234567890',
        profileData: {
          licenseNumber: 'TEST123',
          qualifications: 'PhD Psychology'
        }
      })
    });
    
    const counselorData = await counselorResponse.json();
    console.log('Counselor creation:', counselorData);
    
    // Create student
    const studentResponse = await fetch('/api/auth/register', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test.student.fix@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        course: 'Computer Science',
        yearOfStudy: 2,
        phone: '+1234567891'
      })
    });
    
    const studentData = await studentResponse.json();
    console.log('Student creation:', studentData);
    
    return {
      counselor: counselorData,
      student: studentData
    };
    
  } catch (error) {
    console.error('User creation failed:', error);
    return null;
  }
};

// Test appointment creation
export const testAppointmentCreation = async () => {
  console.log('📅 Testing appointment creation...');
  
  try {
    const apis = await testAPIs();
    if (!apis || !apis.students.success || !apis.counselors.success) {
      console.error('Cannot test appointments - API calls failed');
      return;
    }
    
    const students = apis.students.students;
    const counselors = apis.counselors.counselors;
    
    if (students.length === 0 || counselors.length === 0) {
      console.error('Cannot test appointments - no students or counselors found');
      return;
    }
    
    // Create test appointment
    const appointmentResponse = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: students[0].id,
        counselorId: counselors[0].id,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        durationMinutes: 60,
        reason: 'Test appointment'
      })
    });
    
    const appointmentData = await appointmentResponse.json();
    console.log('Appointment creation:', appointmentData);
    
    return appointmentData;
    
  } catch (error) {
    console.error('Appointment creation failed:', error);
    return null;
  }
};

// Run complete test
export const runCompleteAppointmentTest = async () => {
  console.clear();
  console.log('🚀 Running complete appointment system test...\n');
  
  // Step 1: Create test users
  console.log('='.repeat(60));
  const users = await createTestUsers();
  
  // Wait a moment
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Test APIs
  console.log('\n' + '='.repeat(60));
  const apis = await testAPIs();
  
  // Step 3: Test appointment creation
  console.log('\n' + '='.repeat(60));
  const appointment = await testAppointmentCreation();
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 TEST COMPLETE!');
  console.log('\n📝 Results:');
  console.log('👨‍⚕️ Counselor created:', users?.counselor?.success ? '✅' : '❌');
  console.log('👨‍🎓 Student created:', users?.student?.success ? '✅' : '❌');
  console.log('📊 Students API working:', apis?.students?.success ? '✅' : '❌');
  console.log('👥 Counselors API working:', apis?.counselors?.success ? '✅' : '❌');
  console.log('📅 Appointment creation:', appointment?.success ? '✅' : '❌');
  
  if (apis?.students?.success) {
    console.log(`\n👨‍🎓 Found ${apis.students.count} students in database`);
  }
  if (apis?.counselors?.success) {
    console.log(`👨‍⚕️ Found ${apis.counselors.count} counselors in database`);
  }
  
  console.log('\n🔑 Test accounts:');
  console.log('Counselor: test.counselor.fix@example.com / password123');
  console.log('Student: test.student.fix@example.com / password123');
};

// Add functions to window immediately when this script runs
if (typeof window !== 'undefined') {
  (window as any).testAPIs = testAPIs;
  (window as any).createTestUsers = createTestUsers;
  (window as any).testAppointmentCreation = testAppointmentCreation;
  (window as any).runCompleteAppointmentTest = runCompleteAppointmentTest;
  
  // Auto-announce availability
  setTimeout(() => {
    console.log('');
    console.log('🔧 DIRECT APPOINTMENT FIX TOOLS:');
    console.log('🧪 testAPIs() - Test student/counselor APIs');
    console.log('👥 createTestUsers() - Create test accounts');
    console.log('📅 testAppointmentCreation() - Test appointments');
    console.log('🚀 runCompleteAppointmentTest() - Run full test');
    console.log('');
  }, 1000);
}
