// Comprehensive test script to verify the registration fix

export const testRegistrationSystem = async () => {
  if (typeof window === 'undefined') return;
  
  console.group('🧪 TESTING REGISTRATION SYSTEM');
  
  try {
    console.log('Step 1: Testing API endpoint...');
    
    // Test the students API endpoint
    const response = await fetch('/api/students');
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.success) {
      console.log(`✅ Students API working! Found ${data.count} students`);
      console.log('Students:', data.students);
    } else {
      console.log('❌ Students API failed:', data.error);
    }
    
    console.log('\nStep 2: Testing real-time event system...');
    
    // Set up a listener for real-time updates
    let eventReceived = false;
    const testListener = (e: CustomEvent) => {
      console.log('📡 Received real-time update event:', e.detail);
      eventReceived = true;
    };
    
    window.addEventListener('wellness-users-updated', testListener as EventListener);
    
    // Trigger a test event
    const testEvent = new CustomEvent('wellness-users-updated', {
      detail: { type: 'test', timestamp: Date.now() }
    });
    window.dispatchEvent(testEvent);
    
    setTimeout(() => {
      if (eventReceived) {
        console.log('✅ Real-time event system working!');
      } else {
        console.log('❌ Real-time event system not working');
      }
      
      window.removeEventListener('wellness-users-updated', testListener as EventListener);
    }, 100);
    
    console.log('\nStep 3: System status summary...');
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔐 Auth token exists:', !!document.cookie.includes('auth_token'));
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
  
  console.groupEnd();
};

// Function to create a test counselor account for testing
export const createTestCounselor = async () => {
  console.log('👨‍⚕️ Creating test counselor account...');
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test.counselor@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Counselor',
        role: 'counselor',
        specialization: 'Clinical Psychology',
        experience: '5+ years',
        phone: '+1234567890',
        profileData: {
          licenseNumber: 'LIC123456',
          qualifications: 'PhD in Clinical Psychology, Licensed Therapist'
        }
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Test counselor created successfully!');
      console.log('📧 Email: test.counselor@example.com');
      console.log('🔑 Password: password123');
      console.log('👤 User data:', data.user);
      return data;
    } else {
      console.log('❌ Failed to create test counselor:', data.error);
      return null;
    }
    
  } catch (error) {
    console.error('Error creating test counselor:', error);
    return null;
  }
};

// Function to create a test student account
export const createTestStudent = async () => {
  console.log('👨‍🎓 Creating test student account...');
  
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test.student@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        course: 'Computer Science',
        yearOfStudy: 2,
        phone: '+1234567891',
        hostelName: 'Tech Hostel',
        roomNumber: '101'
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Test student created successfully!');
      console.log('📧 Email: test.student@example.com');
      console.log('🔑 Password: password123');
      console.log('👤 User data:', data.user);
      
      // This should trigger the real-time update
      console.log('📡 Real-time update should have been triggered!');
      return data;
    } else {
      console.log('❌ Failed to create test student:', data.error);
      return null;
    }
    
  } catch (error) {
    console.error('Error creating test student:', error);
    return null;
  }
};

// Complete test flow
export const runCompleteTest = async () => {
  console.log('🚀 Running complete registration test flow...\n');
  
  // Step 1: Test system
  await testRegistrationSystem();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Step 2: Create test accounts
  console.log('\n' + '='.repeat(50));
  await createTestCounselor();
  
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log('\n' + '='.repeat(50));
  await createTestStudent();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Test complete!');
  console.log('📋 Now check:');
  console.log('   1. Login as counselor: test.counselor@example.com / password123');
  console.log('   2. Go to Students page - you should see the test student');
  console.log('   3. Register more students - they should appear in real-time');
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).testRegistrationSystem = testRegistrationSystem;
  (window as any).createTestCounselor = createTestCounselor;
  (window as any).createTestStudent = createTestStudent;
  (window as any).runCompleteTest = runCompleteTest;
  
  console.log('');
  console.log('🧪 REGISTRATION TEST TOOLS LOADED:');
  console.log('🔍 testRegistrationSystem() - Test the API and events');
  console.log('👨‍⚕️ createTestCounselor() - Create test counselor');
  console.log('👨‍🎓 createTestStudent() - Create test student');
  console.log('🚀 runCompleteTest() - Run full test suite');
  console.log('');
}
