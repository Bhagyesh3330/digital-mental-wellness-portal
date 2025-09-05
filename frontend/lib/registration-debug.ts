// Comprehensive debugging utility for student registration issues

export const diagnoseRegistrationIssue = () => {
  if (typeof window === 'undefined') return;
  
  console.group('🔍 REGISTRATION ISSUE DIAGNOSIS');
  
  try {
    // 1. Check localStorage data
    console.group('📁 Storage Analysis');
    const usersData = localStorage.getItem('wellness_users');
    const currentUser = localStorage.getItem('current_user');
    const appointments = localStorage.getItem('wellness_appointments');
    
    console.log('Raw wellness_users:', usersData);
    console.log('Raw current_user:', currentUser);
    console.log('Raw appointments:', appointments);
    
    if (usersData) {
      const users = JSON.parse(usersData);
      console.log('📊 Parsed users:', users);
      console.log('Total users:', users.length);
      
      const students = users.filter(u => u.role === 'student');
      const counselors = users.filter(u => u.role === 'counselor');
      
      console.log('👥 Students:', students.length, students);
      console.log('🧑‍⚕️ Counselors:', counselors.length, counselors);
    }
    console.groupEnd();
    
    // 2. Check current authentication
    console.group('🔐 Authentication Analysis');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      console.log('Logged in user:', user);
      console.log('User role:', user.role);
      console.log('User ID:', user.id);
    } else {
      console.log('❌ No user logged in');
    }
    console.groupEnd();
    
    // 3. Test the getUsersByRole function directly
    console.group('🧪 Function Testing');
    try {
      // Import the function dynamically
      import('../lib/storage/users').then(({ getUsersByRole, getAllUsers }) => {
        console.log('Testing getUsersByRole function...');
        const allUsers = getAllUsers();
        const students = getUsersByRole('student');
        const counselors = getUsersByRole('counselor');
        
        console.log('getAllUsers() result:', allUsers);
        console.log('getUsersByRole("student") result:', students);
        console.log('getUsersByRole("counselor") result:', counselors);
        
        if (allUsers.length > 0 && students.length === 0) {
          console.log('⚠️  ISSUE: Users exist but getUsersByRole returns empty for students');
          console.log('Checking user role field...');
          allUsers.forEach((user, index) => {
            console.log(`User ${index + 1}: role="${user.role}" (type: ${typeof user.role})`);
          });
        }
      });
    } catch (error) {
      console.error('Error testing functions:', error);
    }
    console.groupEnd();
    
    // 4. Check browser environment
    console.group('🌐 Environment Check');
    console.log('typeof window:', typeof window);
    console.log('localStorage available:', typeof localStorage !== 'undefined');
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.groupEnd();
    
  } catch (error) {
    console.error('Error during diagnosis:', error);
  }
  
  console.groupEnd();
};

// Function to manually test the student loading process
export const testStudentLoading = () => {
  console.group('🧪 MANUAL STUDENT LOADING TEST');
  
  try {
    import('../lib/storage/users').then(({ getUsersByRole, getAllUsers }) => {
      console.log('Step 1: Getting all users...');
      const allUsers = getAllUsers();
      console.log('All users:', allUsers);
      
      console.log('Step 2: Filtering students...');
      const students = getUsersByRole('student');
      console.log('Students from getUsersByRole:', students);
      
      console.log('Step 3: Manual filtering...');
      const manualStudents = allUsers.filter(user => user.role === 'student');
      console.log('Manual student filter:', manualStudents);
      
      console.log('Step 4: Checking isActive field...');
      const activeStudents = allUsers.filter(user => user.role === 'student' && user.isActive);
      console.log('Active students only:', activeStudents);
      
      // Check each user individually
      console.log('Step 5: Individual user analysis...');
      allUsers.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          roleType: typeof user.role,
          isActiveType: typeof user.isActive
        });
      });
    });
  } catch (error) {
    console.error('Error in manual test:', error);
  }
  
  console.groupEnd();
};

// Function to create test data and verify it shows up
export const createAndVerifyStudent = () => {
  console.log('🌟 Creating test student and verifying...');
  
  try {
    import('../lib/storage/users').then(({ createUser, getUsersByRole, getAllUsers }) => {
      // Create a test student
      const result = createUser({
        email: 'test.student.debug@example.com',
        firstName: 'Test',
        lastName: 'Student',
        role: 'student',
        course: 'Test Course',
        yearOfStudy: 1,
        phone: '+1234567890'
      });
      
      console.log('Creation result:', result);
      
      if (result.success) {
        console.log('✅ Student created successfully');
        
        // Immediately verify it appears in the system
        setTimeout(() => {
          console.log('Verifying student appears in system...');
          
          const allUsers = getAllUsers();
          const students = getUsersByRole('student');
          
          console.log('All users after creation:', allUsers.length);
          console.log('Students after creation:', students.length);
          
          const createdStudent = allUsers.find(u => u.email === 'test.student.debug@example.com');
          console.log('Created student found:', createdStudent);
          
          if (createdStudent && students.length === 0) {
            console.log('🚨 FOUND THE ISSUE: Student created but not returned by getUsersByRole');
          }
          
        }, 100);
        
      } else {
        console.log('❌ Failed to create student:', result.error);
      }
    });
    
  } catch (error) {
    console.error('Error creating test student:', error);
  }
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).diagnoseRegistrationIssue = diagnoseRegistrationIssue;
  (window as any).testStudentLoading = testStudentLoading;
  (window as any).createAndVerifyStudent = createAndVerifyStudent;
  
  console.log('');
  console.log('🔍 DEBUGGING TOOLS LOADED:');
  console.log('🔍 diagnoseRegistrationIssue() - Comprehensive analysis');
  console.log('🧪 testStudentLoading() - Test the loading functions');
  console.log('🌟 createAndVerifyStudent() - Create and verify test student');
  console.log('');
}
