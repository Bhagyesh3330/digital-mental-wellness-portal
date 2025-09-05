// Force cleanup utility to completely remove all sample users
// This is a comprehensive solution to remove John Doe, Emily Johnson, pyro 11, etc.

export const nukeAllSampleData = () => {
  if (typeof window === 'undefined') {
    console.log('Cannot clean data: running on server side');
    return;
  }

  console.log('🚨 NUCLEAR CLEANUP: Removing ALL sample data...');
  
  try {
    // Step 1: Clear ALL localStorage wellness data
    const allKeys = Object.keys(localStorage);
    let removedKeys = 0;
    
    allKeys.forEach(key => {
      if (key.includes('wellness') || key === 'current_user') {
        localStorage.removeItem(key);
        console.log(`💥 Nuked: ${key}`);
        removedKeys++;
      }
    });
    
    console.log(`✅ Removed ${removedKeys} localStorage keys`);
    
    // Step 2: Wait a moment and check
    setTimeout(() => {
      const remainingData = localStorage.getItem('wellness_users');
      if (remainingData) {
        console.log('⚠️  Data still exists, trying more aggressive cleanup...');
        
        // Parse and manually filter
        const users = JSON.parse(remainingData);
        const beforeCount = users.length;
        
        const cleanUsers = users.filter((user: any) => {
          // Keep only users that definitely don't match sample patterns
          const keepUser = !(
            user.email?.includes('john.doe') ||
            user.email?.includes('emily.johnson') ||
            user.email?.includes('pyro') ||
            user.email?.includes('@wellness.edu') ||
            user.email?.includes('@student.edu') ||
            user.email?.includes('@counselor.edu') ||
            user.firstName === 'John' ||
            user.firstName === 'Emily' ||
            user.firstName?.toLowerCase().includes('pyro') ||
            user.lastName === 'Doe' ||
            user.lastName === 'Johnson' ||
            user.lastName === '11' ||
            user.studentId === 'STU001' ||
            user.studentId === 'STU002' ||
            user.studentId === 'STU003'
          );
          
          if (!keepUser) {
            console.log(`🗑️  Removing: ${user.firstName} ${user.lastName} (${user.email})`);
          }
          
          return keepUser;
        });
        
        console.log(`Before cleanup: ${beforeCount} users`);
        console.log(`After cleanup: ${cleanUsers.length} users`);
        
        localStorage.setItem('wellness_users', JSON.stringify(cleanUsers));
        
        // Also clean appointments
        const appointmentsData = localStorage.getItem('wellness_appointments');
        if (appointmentsData) {
          localStorage.setItem('wellness_appointments', JSON.stringify([]));
          console.log('🗑️  Cleared all appointments');
        }
        
      } else {
        console.log('✅ No user data found - cleanup successful');
      }
      
      console.log('🎉 NUCLEAR CLEANUP COMPLETE!');
      console.log('🔄 REFRESH THE PAGE NOW!');
      
    }, 100);
    
  } catch (error) {
    console.error('💥 Error during nuclear cleanup:', error);
  }
};

// Create clean test users
export const createFreshTestUsers = () => {
  if (typeof window === 'undefined') return;
  
  try {
    // First make sure we have clean slate
    nukeAllSampleData();
    
    setTimeout(() => {
      console.log('🌟 Creating fresh test users...');
      
      const cleanUsers = [
        {
          id: 1,
          email: 'rahul.d@test.edu',
          firstName: 'Rahul',
          lastName: 'D',
          role: 'student',
          course: 'Computer Science', 
          yearOfStudy: 2,
          studentId: 'STU001',
          phone: '+91 9876543210',
          hostelName: 'Tech Hostel',
          roomNumber: '101',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        },
        {
          id: 2,
          email: 'admin.counselor@test.edu',
          firstName: 'Admin',
          lastName: 'Counselor',
          role: 'counselor',
          specialization: 'Clinical Psychology',
          experience: '5+ years',
          phone: '+91 9876543211',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true
        }
      ];
      
      localStorage.setItem('wellness_users', JSON.stringify(cleanUsers));
      localStorage.setItem('wellness_user_next_id', '3');
      localStorage.setItem('wellness_appointments', JSON.stringify([]));
      
      console.log('✅ Fresh test users created:');
      cleanUsers.forEach(user => {
        console.log(`  - ${user.firstName} ${user.lastName} (${user.role})`);
      });
      
      console.log('🔄 REFRESH THE PAGE to see clean data!');
      
    }, 500);
    
  } catch (error) {
    console.error('Error creating fresh users:', error);
  }
};

// Add to window immediately
if (typeof window !== 'undefined') {
  (window as any).nukeAllSampleData = nukeAllSampleData;
  (window as any).createFreshTestUsers = createFreshTestUsers;
  
  console.log('');
  console.log('🚨 EMERGENCY CLEANUP TOOLS LOADED:');
  console.log('💥 nukeAllSampleData() - Remove ALL sample data');
  console.log('🌟 createFreshTestUsers() - Create clean test data');
  console.log('');
}
