const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Get appointments for current user
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

module.exports = router;
