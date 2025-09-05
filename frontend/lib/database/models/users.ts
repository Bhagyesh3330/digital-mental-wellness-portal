import { getDatabase } from '../connection';

export interface DatabaseUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor';
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  course?: string;
  yearOfStudy?: number;
  studentId?: string;
  enrollmentNumber?: string;
  department?: string;
  admissionYear?: number;
  dateOfBirth?: string;
  guardianName?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  specialization?: string;
  experience?: string;
  licenseNumber?: string;
  qualifications?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'counselor';
  phone?: string;
  hostelName?: string;
  roomNumber?: string;
  course?: string;
  yearOfStudy?: number;
  enrollmentNumber?: string;
  department?: string;
  admissionYear?: number;
  dateOfBirth?: string;
  guardianName?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  bloodGroup?: string;
  allergies?: string;
  medicalConditions?: string;
  specialization?: string;
  experience?: string;
  licenseNumber?: string;
  qualifications?: string;
}

export interface UserSession {
  id: number;
  userId: number;
  token: string;
  createdAt: string;
  lastAccessAt: string;
  expiresAt?: string;
}

class UserModel {
  private db = getDatabase();

  // Get all users
  getAllUsers(): DatabaseUser[] {
    const stmt = this.db.prepare('SELECT * FROM users ORDER BY createdAt DESC');
    return stmt.all() as DatabaseUser[];
  }

  // Get users by role
  getUsersByRole(role: 'student' | 'counselor'): DatabaseUser[] {
    const stmt = this.db.prepare('SELECT * FROM users WHERE role = ? AND isActive = 1 ORDER BY firstName, lastName');
    return stmt.all(role) as DatabaseUser[];
  }

  // Get user by ID
  getUserById(id: number): DatabaseUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const result = stmt.get(id) as DatabaseUser;
    return result || null;
  }

  // Get user by email
  getUserByEmail(email: string): DatabaseUser | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE');
    const result = stmt.get(email) as DatabaseUser;
    return result || null;
  }

  // Create user
  createUser(userData: CreateUserData): DatabaseUser {
    // Check if email already exists
    const existingUser = this.getUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Generate student ID for students
    let studentId = userData.role === 'student' ? this.generateStudentId() : null;

    const stmt = this.db.prepare(`
      INSERT INTO users (email, firstName, lastName, role, phone, hostelName, roomNumber, 
                        course, yearOfStudy, studentId, enrollmentNumber, department, admissionYear,
                        dateOfBirth, guardianName, emergencyContact, emergencyRelation, 
                        permanentAddress, city, state, pinCode, bloodGroup, allergies, 
                        medicalConditions, specialization, experience, licenseNumber, qualifications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      userData.email,
      userData.firstName,
      userData.lastName,
      userData.role,
      userData.phone || null,
      userData.hostelName || null,
      userData.roomNumber || null,
      userData.course || null,
      userData.yearOfStudy || null,
      studentId,
      userData.enrollmentNumber || null,
      userData.department || null,
      userData.admissionYear || null,
      userData.dateOfBirth || null,
      userData.guardianName || null,
      userData.emergencyContact || null,
      userData.emergencyRelation || null,
      userData.permanentAddress || null,
      userData.city || null,
      userData.state || null,
      userData.pinCode || null,
      userData.bloodGroup || null,
      userData.allergies || null,
      userData.medicalConditions || null,
      userData.specialization || null,
      userData.experience || null,
      userData.licenseNumber || null,
      userData.qualifications || null
    );

    const newUser = this.getUserById(result.lastInsertRowid as number);
    if (!newUser) {
      throw new Error('Failed to create user');
    }

    console.log(`User created: ${newUser.firstName} ${newUser.lastName} (${newUser.role})`);
    return newUser;
  }

  // Update user
  updateUser(id: number, updates: Partial<DatabaseUser>): boolean {
    const user = this.getUserById(id);
    if (!user) {
      return false;
    }

    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt');
    if (fields.length === 0) {
      return false;
    }

    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(new Date().toISOString()); // updatedAt
    values.push(id); // WHERE clause

    const stmt = this.db.prepare(`
      UPDATE users 
      SET ${setClause}, updatedAt = ?
      WHERE id = ?
    `);

    const result = stmt.run(...values);
    return result.changes > 0;
  }

  // Update last login
  updateLastLogin(id: number): boolean {
    const stmt = this.db.prepare('UPDATE users SET lastLoginAt = ? WHERE id = ?');
    const result = stmt.run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  // Deactivate user (soft delete)
  deactivateUser(id: number): boolean {
    const stmt = this.db.prepare('UPDATE users SET isActive = 0, updatedAt = ? WHERE id = ?');
    const result = stmt.run(new Date().toISOString(), id);
    return result.changes > 0;
  }

  // Generate unique student ID
  private generateStudentId(): string {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM users WHERE role = \'student\'');
    const result = stmt.get() as { count: number };
    const nextId = result.count + 1;
    return `STU${nextId.toString().padStart(3, '0')}`;
  }

  // Authentication methods
  authenticateUser(email: string, password: string): { success: boolean; user?: DatabaseUser; token?: string; error?: string } {
    // For demo purposes, accept any password for registered users
    const user = this.getUserByEmail(email);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    if (!user.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }
    
    // Update last login
    this.updateLastLogin(user.id);
    
    // Create session token
    const token = this.createUserSession(user.id);
    
    return { success: true, user, token };
  }

  // Create user session
  createUserSession(userId: number): string {
    const token = `token_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const stmt = this.db.prepare(`
      INSERT INTO user_sessions (userId, token, expiresAt)
      VALUES (?, ?, ?)
    `);

    stmt.run(userId, token, expiresAt.toISOString());
    return token;
  }

  // Get user from token
  getUserFromToken(token: string): DatabaseUser | null {
    const stmt = this.db.prepare(`
      SELECT u.* FROM users u
      JOIN user_sessions s ON u.id = s.userId
      WHERE s.token = ? AND (s.expiresAt IS NULL OR s.expiresAt > datetime('now'))
      AND u.isActive = 1
    `);

    const user = stmt.get(token) as DatabaseUser;
    
    if (user) {
      // Update last access time
      const updateStmt = this.db.prepare('UPDATE user_sessions SET lastAccessAt = ? WHERE token = ?');
      updateStmt.run(new Date().toISOString(), token);
    }

    return user || null;
  }

  // Logout user (remove session)
  logoutUser(token: string): boolean {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE token = ?');
    const result = stmt.run(token);
    return result.changes > 0;
  }

  // Clean expired sessions
  cleanExpiredSessions(): number {
    const stmt = this.db.prepare('DELETE FROM user_sessions WHERE expiresAt <= datetime(\'now\')');
    const result = stmt.run();
    return result.changes;
  }

  // Get user statistics
  getUserStats() {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN isActive = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = \'student\' THEN 1 ELSE 0 END) as students,
        SUM(CASE WHEN role = \'counselor\' THEN 1 ELSE 0 END) as counselors,
        SUM(CASE WHEN createdAt > datetime('now', '-7 days') THEN 1 ELSE 0 END) as recentRegistrations
      FROM users
    `);

    return stmt.get();
  }
}

export const userModel = new UserModel();
