// Debug utilities to help troubleshoot user and appointment storage issues

export const debugStorage = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot debug storage: running on server side');
    return;
  }

  console.group('🔍 Storage Debug Information');
  
  // Debug users
  console.group('👥 Users Storage');
  try {
    const usersData = localStorage.getItem('wellness_users');
    const users = usersData ? JSON.parse(usersData) : [];
    console.log('Raw users data:', usersData);
    console.log('Parsed users:', users);
    console.log('Total users:', users.length);
    
    if (users.length > 0) {
      const students = users.filter((u: any) => u.role === 'student');
      const counselors = users.filter((u: any) => u.role === 'counselor');
      const admins = users.filter((u: any) => u.role === 'admin');
      
      console.log('Students:', students);
      console.log('Counselors:', counselors);
      console.log('Admins:', admins);
      
      // Check for specific users
      const rahulUser = users.find((u: any) => 
        u.firstName?.toLowerCase().includes('rahul') || 
        u.lastName?.toLowerCase().includes('rahul') ||
        u.email?.toLowerCase().includes('rahul')
      );
      if (rahulUser) {
        console.log('🎯 Found Rahul user:', rahulUser);
      } else {
        console.log('❌ No Rahul user found');
      }
      
      // Check for sample users that might still exist
      const sampleUsers = users.filter((u: any) => {
        return u.email?.includes('@wellness.edu') ||
               u.email?.includes('john.doe@student.edu') ||
               u.email?.includes('emily.johnson@student.edu') ||
               (u.firstName === 'John' && u.lastName === 'Doe') ||
               (u.firstName === 'Emily' && u.lastName === 'Johnson') ||
               u.firstName?.toLowerCase().includes('pyro') ||
               u.lastName === '11' ||
               u.email?.includes('pyro');
      });
      if (sampleUsers.length > 0) {
        console.log('⚠️  Found sample users that should be removed:', sampleUsers);
      } else {
        console.log('✅ No sample users found');
      }
    }
  } catch (error) {
    console.error('Error reading users:', error);
  }
  console.groupEnd();

  // Debug appointments
  console.group('📅 Appointments Storage');
  try {
    const appointmentsData = localStorage.getItem('wellness_appointments');
    const appointments = appointmentsData ? JSON.parse(appointmentsData) : [];
    console.log('Raw appointments data:', appointmentsData);
    console.log('Parsed appointments:', appointments);
    console.log('Total appointments:', appointments.length);
  } catch (error) {
    console.error('Error reading appointments:', error);
  }
  console.groupEnd();

  // Debug current user session
  console.group('🔐 Current Session');
  try {
    const currentUserData = localStorage.getItem('current_user');
    const currentUser = currentUserData ? JSON.parse(currentUserData) : null;
    console.log('Raw current user data:', currentUserData);
    console.log('Parsed current user:', currentUser);
  } catch (error) {
    console.error('Error reading current user:', error);
  }
  console.groupEnd();

  // Debug other storage keys
  console.group('🗂️ All Storage Keys');
  const allKeys = Object.keys(localStorage).filter(key => key.includes('wellness'));
  console.log('All wellness-related keys:', allKeys);
  allKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`${key}:`, value?.substring(0, 100) + (value && value.length > 100 ? '...' : ''));
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
    }
  });
  console.groupEnd();
  
  console.groupEnd();
};

export const clearAllStorage = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot clear storage: running on server side');
    return;
  }

  console.warn('🗑️ Clearing all wellness storage...');
  const allKeys = Object.keys(localStorage).filter(key => key.includes('wellness') || key === 'current_user');
  allKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed: ${key}`);
  });
  console.log('✅ Storage cleared. Refresh the page to reinitialize.');
};

export const removeSampleUsers = (force: boolean = false) => {
  if (typeof window === 'undefined') {
    console.log('Cannot remove sample users: running on server side');
    return { success: false, message: 'Running on server side' };
  }

  try {
    console.warn('🧹 Removing sample users (John Doe, Emily Johnson, pyro 11)...');
    
    // Get current users
    const usersData = localStorage.getItem('wellness_users');
    if (!usersData) {
      const message = 'No users found in storage';
      console.log(message);
      return { success: true, message, removedCount: 0 };
    }
    
    const users = JSON.parse(usersData);
    console.log('Users before cleanup:', users.length);
    console.log('All users:', users.map(u => ({ name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role, id: u.id })));
    
    // Filter out sample users by email patterns and specific names
    const filteredUsers = users.filter((user: any) => {
      const isSampleUser = 
        user.email?.includes('@wellness.edu') ||
        user.email?.includes('john.doe@student.edu') ||
        user.email?.includes('emily.johnson@student.edu') ||
        (user.firstName === 'John' && user.lastName === 'Doe') ||
        (user.firstName === 'Emily' && user.lastName === 'Johnson') ||
        user.firstName?.toLowerCase().includes('pyro') ||
        user.lastName === '11' ||
        user.email?.includes('pyro') ||
        // Additional patterns that might be causing issues
        user.email?.includes('student.edu') ||
        user.email?.includes('counselor.edu');
      
      if (isSampleUser) {
        console.log(`🗑️  Removing sample user: ${user.firstName} ${user.lastName} (${user.email}) [ID: ${user.id}]`);
        return false;
      }
      return true;
    });
    
    const removedCount = users.length - filteredUsers.length;
    console.log('Users after cleanup:', filteredUsers.length);
    console.log('Removed users count:', removedCount);
    
    if (removedCount === 0 && !force) {
      const message = 'No sample users found to remove';
      console.log('✅ ' + message);
      return { success: true, message, removedCount: 0 };
    }
    
    // Save the cleaned users back
    localStorage.setItem('wellness_users', JSON.stringify(filteredUsers));
    
    // Also clean up appointments that reference removed users
    let appointmentsRemoved = 0;
    const appointmentsData = localStorage.getItem('wellness_appointments');
    if (appointmentsData) {
      const appointments = JSON.parse(appointmentsData);
      const removedUserIds = users.filter((u: any) => !filteredUsers.includes(u)).map((u: any) => u.id);
      
      const cleanedAppointments = appointments.filter((apt: any) => 
        !removedUserIds.includes(apt.studentId) && !removedUserIds.includes(apt.counselorId)
      );
      
      appointmentsRemoved = appointments.length - cleanedAppointments.length;
      localStorage.setItem('wellness_appointments', JSON.stringify(cleanedAppointments));
      
      if (appointmentsRemoved > 0) {
        console.log(`📋 Cleaned up ${appointmentsRemoved} associated appointments`);
      }
    }
    
    const message = `Removed ${removedCount} sample users and ${appointmentsRemoved} appointments. Refresh the page to see changes.`;
    console.log('✅ ' + message);
    return { success: true, message, removedCount, appointmentsRemoved };
  } catch (error) {
    console.error('Error removing sample users:', error);
    return { success: false, message: 'Error: ' + error, removedCount: 0 };
  }
};

// Check if user exists by name
export const checkExistingUsers = (nameQuery: string) => {
  if (typeof window === 'undefined') {
    console.log('Cannot check users: running on server side');
    return { success: false, message: 'Running on server side' };
  }
  
  try {
    const usersData = localStorage.getItem('wellness_users');
    if (!usersData) {
      return { success: false, message: 'No users found in storage' };
    }
    
    const users = JSON.parse(usersData);
    const matchedUsers = users.filter((user: any) => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      return fullName.includes(nameQuery.toLowerCase()) ||
             user.email?.toLowerCase().includes(nameQuery.toLowerCase()) ||
             user.firstName?.toLowerCase().includes(nameQuery.toLowerCase()) ||
             user.lastName?.toLowerCase().includes(nameQuery.toLowerCase());
    });
    
    console.log(`Found ${matchedUsers.length} users matching "${nameQuery}":`, matchedUsers);
    return { success: true, users: matchedUsers, count: matchedUsers.length };
  } catch (error) {
    console.error('Error checking for users:', error);
    return { success: false, message: 'Error: ' + error };
  }
};

// Create a test student if needed
export const createTestStudent = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot create test student: running on server side');
    return { success: false, message: 'Running on server side' };
  }
  
  try {
    // First check if this user already exists
    const rahulCheck = checkExistingUsers('rahul');
    if (rahulCheck.success && rahulCheck.count > 0) {
      return { success: true, message: 'Rahul student already exists', user: rahulCheck.users[0] };
    }
    
    // Get existing users to generate a new ID
    const usersData = localStorage.getItem('wellness_users');
    const users = usersData ? JSON.parse(usersData) : [];
    
    // Find the highest ID
    let maxId = 0;
    users.forEach((user: any) => {
      if (user.id > maxId) maxId = user.id;
    });
    
    // Create the test student
    const newStudent = {
      id: maxId + 1,
      email: 'rahul.d@test.edu',
      firstName: 'Rahul',
      lastName: 'D',
      role: 'student',
      course: 'Computer Science',
      yearOfStudy: 2,
      studentId: `STU${String(maxId + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newStudent);
    localStorage.setItem('wellness_users', JSON.stringify(users));
    
    console.log('🌟 Created test student:', newStudent);
    return { success: true, message: 'Test student created successfully', user: newStudent };
  } catch (error) {
    console.error('Error creating test student:', error);
    return { success: false, message: 'Error: ' + error };
  }
};

// Immediate and aggressive cleanup function
export const forceCleanSampleUsers = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot clean users: running on server side');
    return { success: false, message: 'Running on server side' };
  }

  try {
    console.warn('🚨 FORCE CLEANING ALL SAMPLE USERS...');
    
    // Get all localStorage keys and clean everything
    const allKeys = Object.keys(localStorage);
    
    // Clear all wellness data first
    allKeys.forEach(key => {
      if (key.includes('wellness')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed: ${key}`);
      }
    });
    
    // Also clear current_user to reset session
    localStorage.removeItem('current_user');
    
    console.log('✅ ALL SAMPLE DATA FORCIBLY REMOVED!');
    console.log('🔄 Please refresh the page and the sample users will be gone.');
    
    return { success: true, message: 'Force cleanup completed. Refresh the page.' };
  } catch (error) {
    console.error('Error in force cleanup:', error);
    return { success: false, message: 'Error: ' + error };
  }
};

// Complete cleanup and setup function
export const resetAndSetupUsers = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot reset users: running on server side');
    return { success: false, message: 'Running on server side' };
  }
  
  try {
    // 1. First remove all sample users
    const cleanupResult = removeSampleUsers(true); // force cleanup
    
    // 2. Check for test student
    const rahulCheck = checkExistingUsers('rahul');
    
    // 3. Create the test student if it doesn't exist
    if (!rahulCheck.success || rahulCheck.count === 0) {
      const createResult = createTestStudent();
      if (!createResult.success) {
        return { success: false, message: 'Failed to create test student: ' + createResult.message };
      }
    }
    
    return { 
      success: true, 
      message: 'System cleaned and test student ensured. Refresh the page to see changes.'
    };
  } catch (error) {
    console.error('Error resetting users:', error);
    return { success: false, message: 'Error: ' + error };
  }
};

// Trigger real-time update for students list
export const triggerStudentsUpdate = () => {
  if (typeof window === 'undefined') return;
  
  // Dispatch a custom event to notify components about user changes
  const event = new CustomEvent('wellness-users-updated', {
    detail: { timestamp: Date.now() }
  });
  window.dispatchEvent(event);
  console.log('📡 Triggered students list update');
};

// Add to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).debugWellnessStorage = debugStorage;
  (window as any).clearWellnessStorage = clearAllStorage;
  (window as any).removeSampleUsers = removeSampleUsers;
  (window as any).checkExistingUsers = checkExistingUsers;
  (window as any).createTestStudent = createTestStudent;
  (window as any).resetAndSetupUsers = resetAndSetupUsers;
  (window as any).forceCleanSampleUsers = forceCleanSampleUsers;
  (window as any).triggerStudentsUpdate = triggerStudentsUpdate;
  console.log('🔨️ Debug utilities loaded!');
  console.log('🚨 To remove sample users immediately: forceCleanSampleUsers()');
  console.log('🔄 Other functions: debugWellnessStorage(), checkExistingUsers(), createTestStudent(), resetAndSetupUsers()');
}
