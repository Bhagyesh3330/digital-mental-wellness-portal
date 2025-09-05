// Test data creation utilities for debugging user registration and visibility issues

import { createUser } from './storage/users';

export const createTestUsers = () => {
  console.log('🧪 Creating test users...');

  // Create a test student
  const studentResult = createUser({
    email: 'rahul.d@example.com',
    firstName: 'Rahul',
    lastName: 'D',
    role: 'student',
    course: 'Computer Science',
    yearOfStudy: 3,
    hostelName: 'Tech Hostel',
    roomNumber: '204',
    phone: '+91 9876543210'
  });

  // Create a test counselor
  const counselorResult = createUser({
    email: 'admin.doe@example.com',
    firstName: 'Admin',
    lastName: 'Doe',
    role: 'counselor',
    specialization: 'Clinical Psychology',
    experience: '5 years',
    phone: '+91 9876543211'
  });

  console.log('Student creation result:', studentResult);
  console.log('Counselor creation result:', counselorResult);

  if (studentResult.success && counselorResult.success) {
    console.log('✅ Test users created successfully!');
    console.log('Student:', studentResult.user);
    console.log('Counselor:', counselorResult.user);
    return {
      student: studentResult.user,
      counselor: counselorResult.user
    };
  } else {
    console.log('❌ Failed to create test users');
    console.log('Student error:', studentResult.error);
    console.log('Counselor error:', counselorResult.error);
    return null;
  }
};

// Helper function to check current users
export const checkExistingUsers = () => {
  const { getAllUsers, getUsersByRole } = require('./storage/users');
  const allUsers = getAllUsers();
  const students = getUsersByRole('student');
  const counselors = getUsersByRole('counselor');

  console.log('📊 Current users summary:');
  console.log('Total users:', allUsers.length);
  console.log('Students:', students.length);
  console.log('Counselors:', counselors.length);
  
  console.log('\n👥 All users:');
  allUsers.forEach((user: any, index: number) => {
    console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
  });

  return {
    total: allUsers.length,
    students: students.length,
    counselors: counselors.length,
    users: allUsers
  };
};

// Add to window for easy access
if (typeof window !== 'undefined') {
  (window as any).createTestUsers = createTestUsers;
  (window as any).checkExistingUsers = checkExistingUsers;
  console.log('🧪 Test utilities loaded! Use createTestUsers() and checkExistingUsers() in console.');
}
