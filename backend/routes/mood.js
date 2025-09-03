const express = require('express');
const { body, validationResult, query: expressQuery } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, authorizeOwnerOrRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const moodEntryValidation = [
  body('mood_level').isIn(['very_low', 'low', 'neutral', 'good', 'excellent']),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body('energy_level').isInt({ min: 1, max: 10 }),
  body('sleep_hours').isFloat({ min: 0, max: 24 }),
  body('stress_level').isInt({ min: 1, max: 10 })
];

// Create mood entry
router.post('/', authenticateToken, moodEntryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { mood_level, notes, energy_level, sleep_hours, stress_level } = req.body;

    const result = await query(
      `INSERT INTO mood_entries (user_id, mood_level, notes, energy_level, sleep_hours, stress_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at`,
      [req.user.id, mood_level, notes, energy_level, sleep_hours, stress_level]
    );

    res.status(201).json({
      message: 'Mood entry created successfully',
      mood_entry: result.rows[0]
    });
  } catch (error) {
    console.error('Mood entry creation error:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Get mood entries for user
router.get('/user/:userId', authenticateToken, authorizeOwnerOrRole(), async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at
       FROM mood_entries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      'SELECT COUNT(*) as total FROM mood_entries WHERE user_id = $1',
      [userId]
    );

    res.json({
      mood_entries: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        has_more: result.rows.length === limit
      }
    });
  } catch (error) {
    console.error('Mood entries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Get mood statistics
router.get('/user/:userId/stats', authenticateToken, authorizeOwnerOrRole(), async (req, res) => {
  try {
    const userId = req.params.userId;
    const days = parseInt(req.query.days) || 30;

    const result = await query(
      `SELECT 
         COUNT(*) as total_entries,
         AVG(energy_level) as avg_energy,
         AVG(sleep_hours) as avg_sleep,
         AVG(stress_level) as avg_stress,
         mode() WITHIN GROUP (ORDER BY mood_level) as most_common_mood
       FROM mood_entries 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [userId]
    );

    const moodDistribution = await query(
      `SELECT mood_level, COUNT(*) as count
       FROM mood_entries 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       GROUP BY mood_level
       ORDER BY mood_level`,
      [userId]
    );

    res.json({
      period_days: days,
      stats: result.rows[0],
      mood_distribution: moodDistribution.rows
    });
  } catch (error) {
    console.error('Mood stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mood statistics' });
  }
});

// Update mood entry
router.put('/:id', authenticateToken, moodEntryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const moodEntryId = req.params.id;
    const { mood_level, notes, energy_level, sleep_hours, stress_level } = req.body;

    // Check if mood entry exists and belongs to user
    const existing = await query(
      'SELECT user_id FROM mood_entries WHERE id = $1',
      [moodEntryId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    if (existing.rows[0].user_id !== req.user.id && !['admin', 'counselor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await query(
      `UPDATE mood_entries 
       SET mood_level = $1, notes = $2, energy_level = $3, sleep_hours = $4, stress_level = $5
       WHERE id = $6
       RETURNING id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at`,
      [mood_level, notes, energy_level, sleep_hours, stress_level, moodEntryId]
    );

    res.json({
      message: 'Mood entry updated successfully',
      mood_entry: result.rows[0]
    });
  } catch (error) {
    console.error('Mood entry update error:', error);
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

// Delete mood entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const moodEntryId = req.params.id;

    // Check if mood entry exists and belongs to user
    const existing = await query(
      'SELECT user_id FROM mood_entries WHERE id = $1',
      [moodEntryId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }

    if (existing.rows[0].user_id !== req.user.id && !['admin', 'counselor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await query('DELETE FROM mood_entries WHERE id = $1', [moodEntryId]);

    res.json({ message: 'Mood entry deleted successfully' });
  } catch (error) {
    console.error('Mood entry deletion error:', error);
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

module.exports = router;
