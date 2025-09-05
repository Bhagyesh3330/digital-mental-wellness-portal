// User storage system for persistent user management
// This simulates a user database using localStorage

export interface StoredUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor' | 'admin';
  dateOfBirth?: string;
  course?: string;
  yearOfStudy?: number;
  studentId?: string;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  specialization?: string;
  experience?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLoginAt?: string;
}

const USERS_KEY = 'wellness_users';
const USER_ID_KEY = 'wellness_user_next_id';
const SESSIONS_KEY = 'wellness_user_sessions'; // For auth sessions

// Get next available ID
const getNextId = (): number => {
  if (typeof window === 'undefined') return 1;
  
  const stored = localStorage.getItem(USER_ID_KEY);
  const nextId = stored ? parseInt(stored, 10) + 1 : 1;
  localStorage.setItem(USER_ID_KEY, nextId.toString());
  return nextId;
};

// Get all users from localStorage
export const getAllUsers = (): StoredUser[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(USERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading users from localStorage:', error);
    return [];
  }
};

// Save users to localStorage
export const saveAllUsers = (users: StoredUser[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
  }
};

// Get users by role
export const getUsersByRole = (role: 'student' | 'counselor' | 'admin'): StoredUser[] => {
  const allUsers = getAllUsers();
  return allUsers.filter(user => user.role === role && user.isActive);
};

// Get user by ID
export const getUserById = (id: number): StoredUser | null => {
  const allUsers = getAllUsers();
  return allUsers.find(user => user.id === id) || null;
};

// Get user by email
export const getUserByEmail = (email: string): StoredUser | null => {
  const allUsers = getAllUsers();
  return allUsers.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
};

// Create a new user (registration)
export const createUser = (userData: {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor' | 'admin';
  dateOfBirth?: string;
  course?: string;
  yearOfStudy?: number;
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  specialization?: string;
  experience?: string;
}): { success: boolean; user?: StoredUser; error?: string } => {
  const allUsers = getAllUsers();
  
  // Check if email already exists
  const existingUser = getUserByEmail(userData.email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }
  
  const newUser: StoredUser = {
    id: getNextId(),
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
    dateOfBirth: userData.dateOfBirth,
    course: userData.course,
    yearOfStudy: userData.yearOfStudy,
    studentId: userData.role === 'student' ? `STU${String(getNextId()).padStart(3, '0')}` : undefined,
    phone: userData.phone,
    hostelName: userData.hostelName,
    roomNumber: userData.roomNumber,
    specialization: userData.specialization,
    experience: userData.experience,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: true
  };
  
  allUsers.push(newUser);
  saveAllUsers(allUsers);
  
  // Trigger real-time update for counselor dashboards
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('wellness-users-updated', {
      detail: { 
        type: 'user_created', 
        user: newUser, 
        timestamp: Date.now() 
      }
    });
    window.dispatchEvent(event);
    console.log('📡 Triggered real-time update for new user creation');
  }
  
  console.log('New user created:', newUser);
  return { success: true, user: newUser };
};

// Update user
export const updateUser = (id: number, updates: Partial<StoredUser>): boolean => {
  const allUsers = getAllUsers();
  const userIndex = allUsers.findIndex(user => user.id === id);
  
  if (userIndex === -1) return false;
  
  allUsers[userIndex] = {
    ...allUsers[userIndex],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveAllUsers(allUsers);
  return true;
};

// User authentication (login)
export const authenticateUser = (email: string, password: string): { success: boolean; user?: StoredUser; token?: string; error?: string } => {
  // For demo purposes, we'll accept any password for registered users
  // In a real app, you'd hash and compare passwords
  const user = getUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (!user.isActive) {
    return { success: false, error: 'Account is deactivated' };
  }
  
  // Update last login
  updateUser(user.id, { lastLoginAt: new Date().toISOString() });
  
  // Create a simple token (in real app, use JWT)
  const token = `token_${user.id}_${Date.now()}`;
  
  // Store session
  storeUserSession(user.id, token);
  
  return { success: true, user, token };
};

// Store user session
const storeUserSession = (userId: number, token: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    const sessions = stored ? JSON.parse(stored) : {};
    
    sessions[token] = {
      userId,
      createdAt: new Date().toISOString(),
      lastAccessAt: new Date().toISOString()
    };
    
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error storing user session:', error);
  }
};

// Get user from session token
export const getUserFromToken = (token: string): StoredUser | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return null;
    
    const sessions = JSON.parse(stored);
    const session = sessions[token];
    
    if (!session) return null;
    
    // Update last access time
    session.lastAccessAt = new Date().toISOString();
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    
    return getUserById(session.userId);
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  }
};

// Logout (remove session)
export const logoutUser = (token: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem(SESSIONS_KEY);
    if (!stored) return;
    
    const sessions = JSON.parse(stored);
    delete sessions[token];
    
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error logging out user:', error);
  }
};

// Initialize with sample users if empty - DISABLED to prevent old sample data
export const initializeSampleUsers = (): void => {
  // Sample user initialization is now disabled to prevent old users from appearing
  // Users should register normally through the registration process
  console.log('Sample user initialization is disabled - users should register normally');
  return;
};

// Get students assigned to a counselor (based on appointments)
export const getStudentsForCounselor = (counselorId: number): StoredUser[] => {
  // For now, return all students - in a real app, you'd filter by assignment/appointment history
  const students = getUsersByRole('student');
  
  // You could implement logic here to filter students based on:
  // - Who has appointments with this counselor
  // - Who is assigned to this counselor
  // - Who has had sessions with this counselor
  
  return students;
};

// Clear all user data (for testing)
export const clearAllUsers = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    console.log('All user data cleared');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

// Get user statistics
export const getUserStats = () => {
  const allUsers = getAllUsers();
  
  return {
    total: allUsers.length,
    active: allUsers.filter(u => u.isActive).length,
    students: allUsers.filter(u => u.role === 'student').length,
    counselors: allUsers.filter(u => u.role === 'counselor').length,
    admins: allUsers.filter(u => u.role === 'admin').length,
    recentRegistrations: allUsers
      .filter(u => {
        const created = new Date(u.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return created >= weekAgo;
      })
      .length
  };
};
