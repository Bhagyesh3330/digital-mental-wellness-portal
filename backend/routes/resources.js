const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { query } = require('../config/database');

const router = express.Router();

// Get all published resources
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT r.id, r.title, r.content, r.resource_type, r.category,
              u.first_name as author_first_name, u.last_name as author_last_name,
              r.created_at, r.updated_at
       FROM resources r
       LEFT JOIN users u ON r.author_id = u.id
       WHERE r.is_published = true
       ORDER BY r.created_at DESC`
    );

    res.json({ resources: result.rows });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

module.exports = router;
