const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query, transaction } = require('../config/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all pending counselor registrations
router.get('/counselors/pending', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.created_at,
        cp.license_number, cp.specialization, cp.years_of_experience, 
        cp.qualifications, cp.pending_reason
      FROM users u
      JOIN counselor_profiles cp ON u.id = cp.user_id
      WHERE u.role = 'counselor' AND cp.approved = false
      ORDER BY u.created_at DESC
    `);

    res.json({ 
      pending_counselors: result.rows.map(row => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        createdAt: row.created_at,
        licenseNumber: row.license_number,
        specialization: row.specialization,
        yearsOfExperience: row.years_of_experience,
        qualifications: row.qualifications,
        pendingReason: row.pending_reason
      }))
    });
  } catch (error) {
    console.error('Pending counselors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch pending counselors' });
  }
});

// Get all approved counselors
router.get('/counselors/approved', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
        cp.license_number, cp.specialization, cp.years_of_experience, 
        cp.qualifications, cp.approved_at, cp.admin_notes,
        admin_user.first_name as approved_by_first_name,
        admin_user.last_name as approved_by_last_name
      FROM users u
      JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN users admin_user ON cp.approved_by = admin_user.id
      WHERE u.role = 'counselor' AND cp.approved = true
      ORDER BY cp.approved_at DESC
    `);

    res.json({ 
      approved_counselors: result.rows.map(row => ({
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        isActive: row.is_active,
        licenseNumber: row.license_number,
        specialization: row.specialization,
        yearsOfExperience: row.years_of_experience,
        qualifications: row.qualifications,
        approvedAt: row.approved_at,
        adminNotes: row.admin_notes,
        approvedBy: row.approved_by_first_name && row.approved_by_last_name 
          ? `${row.approved_by_first_name} ${row.approved_by_last_name}`
          : null
      }))
    });
  } catch (error) {
    console.error('Approved counselors fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch approved counselors' });
  }
});

// Approve counselor
router.post('/counselors/:id/approve', 
  authenticateToken, 
  authorizeRoles('admin'),
  [
    body('adminNotes').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const counselorId = req.params.id;
      const { adminNotes = '' } = req.body;

      const result = await transaction(async (client) => {
        // Update counselor profile approval status
        const updateResult = await client.query(`
          UPDATE counselor_profiles 
          SET approved = true, 
              approved_at = CURRENT_TIMESTAMP,
              approved_by = $1,
              admin_notes = $2,
              pending_reason = NULL
          FROM users u
          WHERE counselor_profiles.user_id = u.id 
            AND u.id = $3 
            AND u.role = 'counselor'
          RETURNING counselor_profiles.user_id
        `, [req.user.id, adminNotes, counselorId]);

        if (updateResult.rows.length === 0) {
          throw new Error('Counselor not found or already approved');
        }

        // Get updated counselor info
        const counselorResult = await client.query(`
          SELECT u.first_name, u.last_name, u.email
          FROM users u
          WHERE u.id = $1
        `, [counselorId]);

        return counselorResult.rows[0];
      });

      res.json({
        message: `Counselor ${result.first_name} ${result.last_name} has been approved successfully`,
        counselor: {
          id: counselorId,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          approved: true
        }
      });
    } catch (error) {
      console.error('Counselor approval error:', error);
      res.status(500).json({ error: error.message || 'Failed to approve counselor' });
    }
  }
);

// Reject counselor
router.post('/counselors/:id/reject', 
  authenticateToken, 
  authorizeRoles('admin'),
  [
    body('reason').notEmpty().trim().isLength({ min: 10, max: 500 }).withMessage('Rejection reason is required (10-500 characters)'),
    body('adminNotes').optional().trim().isLength({ max: 500 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const counselorId = req.params.id;
      const { reason, adminNotes = '' } = req.body;

      const result = await transaction(async (client) => {
        // Update counselor profile with rejection
        const updateResult = await client.query(`
          UPDATE counselor_profiles 
          SET pending_reason = $1,
              admin_notes = $2,
              approved_by = $3
          FROM users u
          WHERE counselor_profiles.user_id = u.id 
            AND u.id = $4 
            AND u.role = 'counselor'
          RETURNING counselor_profiles.user_id
        `, [reason, adminNotes, req.user.id, counselorId]);

        if (updateResult.rows.length === 0) {
          throw new Error('Counselor not found');
        }

        // Get updated counselor info
        const counselorResult = await client.query(`
          SELECT u.first_name, u.last_name, u.email
          FROM users u
          WHERE u.id = $1
        `, [counselorId]);

        return counselorResult.rows[0];
      });

      res.json({
        message: `Counselor ${result.first_name} ${result.last_name} application has been rejected`,
        counselor: {
          id: counselorId,
          firstName: result.first_name,
          lastName: result.last_name,
          email: result.email,
          approved: false,
          rejectionReason: reason
        }
      });
    } catch (error) {
      console.error('Counselor rejection error:', error);
      res.status(500).json({ error: error.message || 'Failed to reject counselor' });
    }
  }
);

// Get counselor application details
router.get('/counselors/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const counselorId = req.params.id;
    
    const result = await query(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.phone, u.hostel_name, 
        u.room_number, u.created_at, u.is_active,
        cp.license_number, cp.specialization, cp.years_of_experience, 
        cp.qualifications, cp.approved, cp.pending_reason, cp.admin_notes,
        cp.approved_at,
        admin_user.first_name as approved_by_first_name,
        admin_user.last_name as approved_by_last_name
      FROM users u
      JOIN counselor_profiles cp ON u.id = cp.user_id
      LEFT JOIN users admin_user ON cp.approved_by = admin_user.id
      WHERE u.id = $1 AND u.role = 'counselor'
    `, [counselorId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Counselor not found' });
    }

    const counselor = result.rows[0];
    
    res.json({
      counselor: {
        id: counselor.id,
        email: counselor.email,
        firstName: counselor.first_name,
        lastName: counselor.last_name,
        phone: counselor.phone,
        hostelName: counselor.hostel_name,
        roomNumber: counselor.room_number,
        createdAt: counselor.created_at,
        isActive: counselor.is_active,
        licenseNumber: counselor.license_number,
        specialization: counselor.specialization,
        yearsOfExperience: counselor.years_of_experience,
        qualifications: counselor.qualifications,
        approved: counselor.approved,
        pendingReason: counselor.pending_reason,
        adminNotes: counselor.admin_notes,
        approvedAt: counselor.approved_at,
        approvedBy: counselor.approved_by_first_name && counselor.approved_by_last_name 
          ? `${counselor.approved_by_first_name} ${counselor.approved_by_last_name}`
          : null
      }
    });
  } catch (error) {
    console.error('Counselor details fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch counselor details' });
  }
});

module.exports = router;
