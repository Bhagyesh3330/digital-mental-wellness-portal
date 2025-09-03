const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').trim().isLength({ min: 2, max: 50 }),
  body('lastName').trim().isLength({ min: 2, max: 50 }),
  body('role').isIn(['student', 'counselor', 'admin']),
  body('phone').optional().isMobilePhone(),
  body('hostelName').optional().trim().isLength({ max: 100 }),
  body('roomNumber').optional().trim().isLength({ max: 10 })
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Register new user
router.post('/register', registerValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const {
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      hostelName,
      roomNumber,
      profileData = {}
    } = req.body;

    // Check if user already exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and profile in transaction
    const result = await transaction(async (client) => {
      // Insert user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, hostel_name, room_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, passwordHash, firstName, lastName, role, phone, hostelName, roomNumber]
      );

      const user = userResult.rows[0];

      // Insert role-specific profile
      if (role === 'student') {
        await client.query(
          `INSERT INTO student_profiles (user_id, student_id, course, year_of_study, date_of_birth, guardian_contact)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.id,
            profileData.studentId,
            profileData.course,
            profileData.yearOfStudy,
            profileData.dateOfBirth,
            profileData.guardianContact
          ]
        );
      } else if (role === 'counselor') {
        await client.query(
          `INSERT INTO counselor_profiles (user_id, license_number, specialization, years_of_experience, qualifications)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            user.id,
            profileData.licenseNumber,
            profileData.specialization,
            profileData.yearsOfExperience,
            profileData.qualifications
          ]
        );
      } else if (role === 'admin') {
        await client.query(
          `INSERT INTO admin_profiles (user_id, department, permissions)
           VALUES ($1, $2, $3)`,
          [
            user.id,
            profileData.department,
            JSON.stringify(profileData.permissions || {})
          ]
        );
      }

      return user;
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.id, email: result.email, role: result.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.first_name,
        lastName: result.last_name,
        role: result.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login user
router.post('/login', loginValidation, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Get user from database
    const result = await query(
      `SELECT id, email, password_hash, first_name, last_name, role, is_active 
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    let profileQuery;
    let profileParams;

    // Get role-specific profile data
    switch (req.user.role) {
      case 'student':
        profileQuery = `
          SELECT u.*, sp.student_id, sp.course, sp.year_of_study, 
                 sp.date_of_birth, sp.guardian_contact, sp.medical_conditions
          FROM users u
          LEFT JOIN student_profiles sp ON u.id = sp.user_id
          WHERE u.id = $1
        `;
        break;
      case 'counselor':
        profileQuery = `
          SELECT u.*, cp.license_number, cp.specialization, cp.years_of_experience,
                 cp.qualifications, cp.availability_schedule
          FROM users u
          LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
          WHERE u.id = $1
        `;
        break;
      case 'admin':
        profileQuery = `
          SELECT u.*, ap.department, ap.permissions
          FROM users u
          LEFT JOIN admin_profiles ap ON u.id = ap.user_id
          WHERE u.id = $1
        `;
        break;
    }

    const result = await query(profileQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Remove sensitive information
    const profile = result.rows[0];
    delete profile.password_hash;

    res.json(profile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Logout (invalidate token on client side)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({ message: 'Logout successful' });
});

module.exports = router;
