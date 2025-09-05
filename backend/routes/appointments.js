const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get available counselors (only approved ones)
router.get('/counselors', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.first_name, u.last_name, u.email, 
              cp.specialization, cp.years_of_experience
       FROM users u
       JOIN counselor_profiles cp ON u.id = cp.user_id
       WHERE u.role = 'counselor' AND u.is_active = true AND cp.approved = true
       ORDER BY u.first_name, u.last_name`,
      []
    );
    
    const counselors = result.rows.map(counselor => ({
      id: counselor.id,
      firstName: counselor.first_name,
      lastName: counselor.last_name,
      email: counselor.email,
      specialization: counselor.specialization,
      yearsOfExperience: counselor.years_of_experience
    }));
    
    res.json({ counselors });
  } catch (error) {
    console.error('Counselors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch counselors' });
  }
});

// Get appointments for current user (my-appointments endpoint for frontend compatibility)
router.get('/my-appointments', authenticateToken, async (req, res) => {
  try {
    let appointmentsQuery;
    let params = [req.user.id];

    if (req.user.role === 'student') {
      appointmentsQuery = `
        SELECT a.id, a.student_id, a.counselor_id, a.appointment_date, 
               a.duration_minutes, a.status, a.reason, a.notes,
               a.created_at, a.updated_at,
               u.first_name as counselor_first_name, 
               u.last_name as counselor_last_name
        FROM appointments a
        JOIN users u ON a.counselor_id = u.id
        WHERE a.student_id = $1
        ORDER BY a.appointment_date DESC
      `;
    } else if (req.user.role === 'counselor') {
      appointmentsQuery = `
        SELECT a.id, a.student_id, a.counselor_id, a.appointment_date, 
               a.duration_minutes, a.status, a.reason, a.notes,
               a.created_at, a.updated_at,
               u.first_name as student_first_name, 
               u.last_name as student_last_name
        FROM appointments a
        JOIN users u ON a.student_id = u.id
        WHERE a.counselor_id = $1
        ORDER BY a.appointment_date DESC
      `;
    }

    const result = await query(appointmentsQuery, params);
    
    // Map database columns to camelCase
    const appointments = result.rows.map(appointment => ({
      id: appointment.id,
      studentId: appointment.student_id,
      counselorId: appointment.counselor_id,
      appointmentDate: appointment.appointment_date,
      durationMinutes: appointment.duration_minutes,
      status: appointment.status,
      reason: appointment.reason,
      notes: appointment.notes,
      studentFirstName: appointment.student_first_name,
      studentLastName: appointment.student_last_name,
      counselorFirstName: appointment.counselor_first_name,
      counselorLastName: appointment.counselor_last_name,
      createdAt: appointment.created_at,
      updatedAt: appointment.updated_at
    }));
    
    res.json({ appointments });
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get appointments for current user (legacy endpoint)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let appointmentsQuery;
    let params = [req.user.id];

    if (req.user.role === 'student') {
      appointmentsQuery = `
        SELECT a.*, u.first_name as counselor_first_name, u.last_name as counselor_last_name
        FROM appointments a
        JOIN users u ON a.counselor_id = u.id
        WHERE a.student_id = $1
        ORDER BY a.appointment_date DESC
      `;
    } else if (req.user.role === 'counselor') {
      appointmentsQuery = `
        SELECT a.*, u.first_name as student_first_name, u.last_name as student_last_name
        FROM appointments a
        JOIN users u ON a.student_id = u.id
        WHERE a.counselor_id = $1
        ORDER BY a.appointment_date DESC
      `;
    } else {
      appointmentsQuery = `
        SELECT a.*, 
               s.first_name as student_first_name, s.last_name as student_last_name,
               c.first_name as counselor_first_name, c.last_name as counselor_last_name
        FROM appointments a
        JOIN users s ON a.student_id = s.id
        JOIN users c ON a.counselor_id = c.id
        ORDER BY a.appointment_date DESC
      `;
      params = [];
    }

    const result = await query(appointmentsQuery, params);
    res.json({ appointments: result.rows });
  } catch (error) {
    console.error('Appointments fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Create new appointment
router.post('/', authenticateToken, [
  body('counselorId').isInt({ min: 1 }),
  body('appointmentDate').isISO8601(),
  body('durationMinutes').optional().isInt({ min: 15, max: 180 }),
  body('reason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { counselorId, appointmentDate, durationMinutes = 60, reason } = req.body;
    
    // Only students can book appointments
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can book appointments' });
    }

    // Verify counselor exists and is approved
    const counselorCheck = await query(
      `SELECT u.id FROM users u 
       JOIN counselor_profiles cp ON u.id = cp.user_id
       WHERE u.id = $1 AND u.role = $2 AND u.is_active = true AND cp.approved = true`,
      [counselorId, 'counselor']
    );
    
    if (counselorCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Counselor not found or not approved' });
    }

    // Create appointment
    const result = await query(
      `INSERT INTO appointments (student_id, counselor_id, appointment_date, duration_minutes, reason)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, counselor_id, appointment_date, duration_minutes, status, reason, created_at`,
      [req.user.id, counselorId, appointmentDate, durationMinutes, reason]
    );

    const appointmentData = result.rows[0];
    const appointment = {
      id: appointmentData.id,
      studentId: appointmentData.student_id,
      counselorId: appointmentData.counselor_id,
      appointmentDate: appointmentData.appointment_date,
      durationMinutes: appointmentData.duration_minutes,
      status: appointmentData.status,
      reason: appointmentData.reason,
      createdAt: appointmentData.created_at
    };

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Cancel appointment
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    
    // Check if appointment exists and user has access
    const appointmentCheck = await query(
      'SELECT student_id, counselor_id, status FROM appointments WHERE id = $1',
      [appointmentId]
    );
    
    if (appointmentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appointment = appointmentCheck.rows[0];
    
    // Check permissions
    if (req.user.role === 'student' && appointment.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (req.user.role === 'counselor' && appointment.counselor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Can't cancel already completed or cancelled appointments
    if (['completed', 'cancelled'].includes(appointment.status)) {
      return res.status(400).json({ error: `Cannot cancel ${appointment.status} appointment` });
    }
    
    // Update appointment status
    await query(
      'UPDATE appointments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['cancelled', appointmentId]
    );
    
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Appointment cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel appointment' });
  }
});

module.exports = router;
