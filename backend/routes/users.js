const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, 
              u.hostel_name, u.room_number, u.is_active, u.created_at
       FROM users u
       ORDER BY u.created_at DESC`
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get users by role
router.get('/role/:role', authenticateToken, authorizeRoles('admin', 'counselor'), async (req, res) => {
  try {
    const role = req.params.role;
    
    const result = await query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, 
              u.hostel_name, u.room_number, u.is_active, u.created_at
       FROM users u
       WHERE u.role = $1 AND u.is_active = true
       ORDER BY u.first_name, u.last_name`,
      [role]
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Users by role fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users by role' });
  }
});

module.exports = router;
