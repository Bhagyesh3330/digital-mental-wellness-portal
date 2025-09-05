import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'wellness_portal.db');
let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeTables();
  }
  return db;
};

const initializeTables = () => {
  const db = getDatabase();
  
  // Users table (no admin role)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'counselor')) NOT NULL,
      phone TEXT,
      hostelName TEXT,
      roomNumber TEXT,
      course TEXT,
      yearOfStudy INTEGER,
      studentId TEXT,
      dateOfBirth TEXT,
      specialization TEXT,
      experience TEXT,
      licenseNumber TEXT,
      qualifications TEXT,
      isActive BOOLEAN DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastLoginAt TEXT
    )
  `);

  // Appointments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER NOT NULL,
      counselorId INTEGER NOT NULL,
      appointmentDate TEXT NOT NULL,
      durationMinutes INTEGER DEFAULT 60,
      status TEXT CHECK(status IN ('scheduled', 'completed', 'cancelled', 'no_show')) DEFAULT 'scheduled',
      reason TEXT,
      notes TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (studentId) REFERENCES users(id),
      FOREIGN KEY (counselorId) REFERENCES users(id)
    )
  `);

  // Wellness goals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wellness_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      targetDate TEXT,
      isCompleted BOOLEAN DEFAULT 0,
      progressPercentage INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Mood entries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mood_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      moodLevel TEXT CHECK(moodLevel IN ('very_low', 'low', 'neutral', 'good', 'excellent')) NOT NULL,
      notes TEXT,
      energyLevel INTEGER NOT NULL CHECK(energyLevel >= 1 AND energyLevel <= 10),
      sleepHours REAL NOT NULL,
      stressLevel INTEGER NOT NULL CHECK(stressLevel >= 1 AND stressLevel <= 10),
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT CHECK(type IN ('article', 'video', 'book', 'worksheet', 'reference')) NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      author TEXT NOT NULL,
      rating REAL DEFAULT 0,
      downloads INTEGER DEFAULT 0,
      tags TEXT,
      duration TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT CHECK(type IN ('wellness_score_change', 'mood_milestone', 'streak_achievement', 'improvement', 'decline', 'milestone', 'alert')) NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      previous_score INTEGER,
      current_score INTEGER,
      score_change INTEGER,
      is_read BOOLEAN DEFAULT 0,
      priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'low',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // User sessions table for authentication
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      lastAccessAt TEXT DEFAULT CURRENT_TIMESTAMP,
      expiresAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  // Add new columns if they don't exist (migration)
  try {
    db.exec('ALTER TABLE users ADD COLUMN licenseNumber TEXT');
    console.log('Added licenseNumber column to users table');
  } catch (error) {
    // Column might already exist, ignore error
  }
  
  try {
    db.exec('ALTER TABLE users ADD COLUMN qualifications TEXT');
    console.log('Added qualifications column to users table');
  } catch (error) {
    // Column might already exist, ignore error
  }

  // Add comprehensive student fields
  const newFields = [
    'enrollmentNumber TEXT',
    'department TEXT',
    'admissionYear INTEGER',
    'guardianName TEXT',
    'emergencyContact TEXT',
    'emergencyRelation TEXT',
    'permanentAddress TEXT',
    'city TEXT',
    'state TEXT',
    'pinCode TEXT',
    'bloodGroup TEXT',
    'allergies TEXT',
    'medicalConditions TEXT'
  ];

  newFields.forEach(field => {
    try {
      const fieldName = field.split(' ')[0];
      db.exec(`ALTER TABLE users ADD COLUMN ${field}`);
      console.log(`Added ${fieldName} column to users table`);
    } catch (error) {
      // Column might already exist, ignore error
    }
  });
  
  console.log('Database tables initialized successfully');
};

// Initialize sample data if tables are empty - DISABLED
export const initializeSampleData = () => {
  // Sample data initialization is now disabled to prevent old users from appearing
  console.log('Sample data initialization is disabled - users should register normally');
  return;
  
  const db = getDatabase();
  
  // Check if users exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  
  if (userCount.count === 0) {
    console.log('Initializing sample data...');
    
    // Insert sample users (no admin)
    const insertUser = db.prepare(`
      INSERT INTO users (email, firstName, lastName, role, specialization, experience, studentId, course, yearOfStudy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Sample counselors
    insertUser.run('dr.sarah@wellness.edu', 'Dr. Sarah', 'Wilson', 'counselor', 'Anxiety and Depression', '8 years', null, null, null);
    insertUser.run('dr.mike@wellness.edu', 'Dr. Michael', 'Chen', 'counselor', 'Student Life and Academic Pressure', '5 years', null, null, null);
    insertUser.run('dr.emily@wellness.edu', 'Dr. Emily', 'Johnson', 'counselor', 'Stress Management', '10 years', null, null, null);
    
    // Sample students
    insertUser.run('john.doe@student.edu', 'John', 'Doe', 'student', null, null, 'STU001', 'Computer Science', 2);
    insertUser.run('emily.johnson@student.edu', 'Emily', 'Johnson', 'student', null, null, 'STU002', 'Psychology', 3);
    insertUser.run('mike.smith@student.edu', 'Mike', 'Smith', 'student', null, null, 'STU003', 'Engineering', 1);
    
    console.log('Sample users created');
    
    // Create some sample goals and mood entries
    const users = db.prepare('SELECT id, role FROM users').all() as Array<{id: number, role: string}>;
    const students = users.filter(u => u.role === 'student');
    
    if (students.length > 0) {
      const insertGoal = db.prepare(`
        INSERT INTO wellness_goals (userId, title, description, progressPercentage)
        VALUES (?, ?, ?, ?)
      `);
      
      insertGoal.run(students[0].id, 'Exercise 3 times a week', 'Go to the gym or do home workouts', 25);
      insertGoal.run(students[0].id, 'Practice mindfulness daily', 'Spend 10 minutes each day meditating', 60);
      
      const insertMoodEntry = db.prepare(`
        INSERT INTO mood_entries (userId, moodLevel, energyLevel, sleepHours, stressLevel, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertMoodEntry.run(students[0].id, 'good', 7, 8, 3, 'Feeling pretty good today');
      insertMoodEntry.run(students[0].id, 'neutral', 6, 7, 4, 'Average day');
      
      console.log('Sample goals and mood entries created');
    }
    
    // Create sample resources
    const insertResource = db.prepare(`
      INSERT INTO resources (title, description, type, category, url, author, rating, downloads, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertResource.run(
      'Managing Academic Stress: A Complete Guide',
      'Comprehensive strategies for handling academic pressure and maintaining mental wellness.',
      'article',
      'academic',
      '/resources/academic-stress-guide.pdf',
      'Dr. Sarah Johnson',
      4.8,
      245,
      'stress,academic,coping strategies'
    );
    
    insertResource.run(
      'Mindfulness Meditation for Students',
      '15-minute guided meditation session specifically designed for students.',
      'video',
      'mindfulness',
      '/resources/mindfulness-meditation.mp4',
      'Dr. Michael Chen',
      4.9,
      189,
      'mindfulness,meditation,relaxation'
    );
    
    insertResource.run(
      'Anxiety Coping Techniques Worksheet',
      'Printable worksheet with practical exercises for managing anxiety symptoms.',
      'worksheet',
      'anxiety',
      '/resources/anxiety-worksheet.pdf',
      'Dr. Emily Davis',
      4.7,
      312,
      'anxiety,coping,exercises'
    );
    
    insertResource.run(
      'Building Healthy Relationships',
      'Guide to developing and maintaining healthy relationships during university years.',
      'article',
      'relationships',
      '/resources/healthy-relationships.pdf',
      'Dr. Lisa Brown',
      4.6,
      156,
      'relationships,communication,social skills'
    );
    
    insertResource.run(
      'Crisis Support Hotlines & Resources',
      'Essential contact information and immediate support resources for crisis situations.',
      'reference',
      'crisis',
      '/resources/crisis-support.pdf',
      'Wellness Team',
      5.0,
      89,
      'crisis,emergency,support'
    );
    
    console.log('Sample resources created');
    
    // Create sample notifications for students
    if (students.length > 0) {
      const insertNotification = db.prepare(`
        INSERT INTO notifications (user_id, type, title, message, current_score, priority)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertNotification.run(
        students[0].id,
        'milestone',
        '🌟 Welcome to Wellness Tracking!',
        'Your initial wellness score is 65. We\'ll notify you about important changes to help you stay on track.',
        65,
        'low'
      );
      
      console.log('Sample notifications created');
    }
  }
};

// Cleanup function
export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};
