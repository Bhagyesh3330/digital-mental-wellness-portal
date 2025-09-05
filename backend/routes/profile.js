const express = require('express');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');

const router = express.Router();

// Get student profile
router.get('/student', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        error: 'Access denied. Student role required.'
      });
    }

    // Get user data with student profile
    const userQuery = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, 
        u.hostel_name, u.room_number, u.is_active, u.created_at,
        sp.student_id, sp.course, sp.year_of_study, sp.date_of_birth, sp.guardian_contact
      FROM users u
      LEFT JOIN student_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1 AND u.role = 'student'
    `;

    const result = await pool.query(userQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Student profile not found'
      });
    }

    const user = result.rows[0];
    
    // Format response
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      hostelName: user.hostel_name,
      roomNumber: user.room_number,
      isActive: user.is_active,
      createdAt: user.created_at,
      studentProfile: {
        studentId: user.student_id,
        course: user.course,
        yearOfStudy: user.year_of_study,
        dateOfBirth: user.date_of_birth,
        guardianContact: user.guardian_contact
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({
      error: 'Failed to fetch student profile'
    });
  }
});

// Get counselor profile
router.get('/counselor', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'counselor') {
      return res.status(403).json({
        error: 'Access denied. Counselor role required.'
      });
    }

    // Get user data with counselor profile
    const userQuery = `
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, 
        u.is_active, u.created_at,
        cp.license_number, cp.specialization, cp.years_of_experience, 
        cp.qualifications, cp.availability_schedule
      FROM users u
      LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
      WHERE u.id = $1 AND u.role = 'counselor'
    `;

    const result = await pool.query(userQuery, [req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Counselor profile not found'
      });
    }

    const user = result.rows[0];
    
    // Format response
    const profile = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      isActive: user.is_active,
      createdAt: user.created_at,
      counselorProfile: {
        licenseNumber: user.license_number,
        specialization: user.specialization,
        yearsOfExperience: user.years_of_experience,
        qualifications: user.qualifications,
        availabilitySchedule: user.availability_schedule
      }
    };

    res.json(profile);
  } catch (error) {
    console.error('Error fetching counselor profile:', error);
    res.status(500).json({
      error: 'Failed to fetch counselor profile'
    });
  }
});

// Update profile
router.put('/', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      firstName,
      lastName,
      phone,
      hostelName,
      roomNumber,
      profileData
    } = req.body;

    // Update basic user information
    const updateUserQuery = `
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        hostel_name = COALESCE($4, hostel_name),
        room_number = COALESCE($5, room_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;

    const userResult = await client.query(updateUserQuery, [
      firstName,
      lastName,
      phone,
      hostelName,
      roomNumber,
      req.user.id
    ]);

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updatedUser = userResult.rows[0];

    // Update role-specific profile data
    if (req.user.role === 'student' && profileData) {
      // Check if student profile exists
      const checkStudentProfile = await client.query(
        'SELECT id FROM student_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (checkStudentProfile.rows.length === 0) {
        // Create student profile if it doesn't exist
        await client.query(`
          INSERT INTO student_profiles (user_id, student_id, course, year_of_study, date_of_birth, guardian_contact)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          req.user.id,
          profileData.studentId,
          profileData.course,
          profileData.yearOfStudy,
          profileData.dateOfBirth,
          profileData.guardianContact
        ]);
      } else {
        // Update existing student profile
        await client.query(`
          UPDATE student_profiles 
          SET 
            student_id = COALESCE($1, student_id),
            course = COALESCE($2, course),
            year_of_study = COALESCE($3, year_of_study),
            date_of_birth = COALESCE($4, date_of_birth),
            guardian_contact = COALESCE($5, guardian_contact)
          WHERE user_id = $6
        `, [
          profileData.studentId,
          profileData.course,
          profileData.yearOfStudy,
          profileData.dateOfBirth,
          profileData.guardianContact,
          req.user.id
        ]);
      }
    }

    if (req.user.role === 'counselor' && profileData) {
      // Check if counselor profile exists
      const checkCounselorProfile = await client.query(
        'SELECT id FROM counselor_profiles WHERE user_id = $1',
        [req.user.id]
      );

      if (checkCounselorProfile.rows.length === 0) {
        // Create counselor profile if it doesn't exist
        await client.query(`
          INSERT INTO counselor_profiles (user_id, specialization, years_of_experience, qualifications)
          VALUES ($1, $2, $3, $4)
        `, [
          req.user.id,
          profileData.specialization,
          profileData.yearsOfExperience,
          profileData.qualifications
        ]);
      } else {
        // Update existing counselor profile
        await client.query(`
          UPDATE counselor_profiles 
          SET 
            specialization = COALESCE($1, specialization),
            years_of_experience = COALESCE($2, years_of_experience),
            qualifications = COALESCE($3, qualifications)
          WHERE user_id = $4
        `, [
          profileData.specialization,
          profileData.yearsOfExperience,
          profileData.qualifications,
          req.user.id
        ]);
      }
    }

    await client.query('COMMIT');

    // Fetch updated profile to return
    let updatedProfile;
    if (req.user.role === 'student') {
      const profileQuery = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, 
          u.hostel_name, u.room_number, u.is_active, u.created_at,
          sp.student_id, sp.course, sp.year_of_study, sp.date_of_birth, sp.guardian_contact
        FROM users u
        LEFT JOIN student_profiles sp ON u.id = sp.user_id
        WHERE u.id = $1
      `;
      const result = await client.query(profileQuery, [req.user.id]);
      const user = result.rows[0];
      
      updatedProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        hostelName: user.hostel_name,
        roomNumber: user.room_number,
        isActive: user.is_active,
        createdAt: user.created_at,
        studentProfile: {
          studentId: user.student_id,
          course: user.course,
          yearOfStudy: user.year_of_study,
          dateOfBirth: user.date_of_birth,
          guardianContact: user.guardian_contact
        }
      };
    } else if (req.user.role === 'counselor') {
      const profileQuery = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, 
          u.is_active, u.created_at,
          cp.license_number, cp.specialization, cp.years_of_experience, 
          cp.qualifications, cp.availability_schedule
        FROM users u
        LEFT JOIN counselor_profiles cp ON u.id = cp.user_id
        WHERE u.id = $1
      `;
      const result = await client.query(profileQuery, [req.user.id]);
      const user = result.rows[0];
      
      updatedProfile = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        isActive: user.is_active,
        createdAt: user.created_at,
        counselorProfile: {
          licenseNumber: user.license_number,
          specialization: user.specialization,
          yearsOfExperience: user.years_of_experience,
          qualifications: user.qualifications,
          availabilitySchedule: user.availability_schedule
        }
      };
    }

    res.json(updatedProfile);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating profile:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  } finally {
    client.release();
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must be at least 8 characters long'
      });
    }

    // Get current user password
    const userQuery = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = userQuery.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      error: 'Failed to change password'
    });
  }
});

module.exports = router;
