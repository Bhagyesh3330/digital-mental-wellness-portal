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

// Field mapping middleware to convert camelCase to snake_case
const mapMoodFields = (req, res, next) => {
  if (req.body.moodLevel) req.body.mood_level = req.body.moodLevel;
  if (req.body.energyLevel !== undefined) req.body.energy_level = req.body.energyLevel;
  if (req.body.sleepHours !== undefined) req.body.sleep_hours = req.body.sleepHours;
  if (req.body.stressLevel !== undefined) req.body.stress_level = req.body.stressLevel;
  next();
};

// Calculate energy based on sleep hours and goals completion
const calculateEnergyLevel = async (userId, sleepHours, providedEnergy) => {
  try {
    // If energy is manually provided, use it
    if (providedEnergy && providedEnergy > 0) {
      return providedEnergy;
    }

    // Base energy calculation from sleep (optimal sleep is 7-9 hours)
    let energyFromSleep = 0;
    if (sleepHours >= 7 && sleepHours <= 9) {
      energyFromSleep = 8; // High energy for optimal sleep
    } else if (sleepHours >= 6 && sleepHours <= 10) {
      energyFromSleep = 6; // Moderate energy for decent sleep
    } else if (sleepHours >= 4) {
      energyFromSleep = 4; // Low energy for poor sleep
    } else {
      energyFromSleep = 2; // Very low energy for very poor sleep
    }

    // Get user's recent goals completion rate (last 7 days)
    const goalsResult = await query(
      `SELECT 
         COUNT(*) as total_goals,
         COUNT(*) FILTER (WHERE is_completed = true) as completed_goals
       FROM wellness_goals 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days'`,
      [userId]
    );

    let energyFromGoals = 0;
    if (goalsResult.rows[0].total_goals > 0) {
      const completionRate = goalsResult.rows[0].completed_goals / goalsResult.rows[0].total_goals;
      energyFromGoals = Math.round(completionRate * 2); // 0-2 bonus points from goals
    }

    // Combine sleep and goals energy (max 10)
    const calculatedEnergy = Math.min(10, energyFromSleep + energyFromGoals);
    return calculatedEnergy;
  } catch (error) {
    console.error('Energy calculation error:', error);
    return 5; // Default moderate energy if calculation fails
  }
};

// Create mood entry
router.post('/', authenticateToken, mapMoodFields, moodEntryValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { mood_level, notes, energy_level, sleep_hours, stress_level } = req.body;

    // Calculate energy if not provided or enhance provided energy
    const calculatedEnergy = await calculateEnergyLevel(req.user.id, sleep_hours, energy_level);

    const result = await query(
      `INSERT INTO mood_entries (user_id, mood_level, notes, energy_level, sleep_hours, stress_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at`,
      [req.user.id, mood_level, notes, calculatedEnergy, sleep_hours, stress_level]
    );

    const moodEntry = {
      id: result.rows[0].id,
      userId: req.user.id,
      moodLevel: result.rows[0].mood_level,
      notes: result.rows[0].notes,
      energyLevel: result.rows[0].energy_level,
      sleepHours: result.rows[0].sleep_hours,
      stressLevel: result.rows[0].stress_level,
      createdAt: result.rows[0].created_at
    };

    res.status(201).json({
      message: 'Mood entry created successfully',
      moodEntry
    });
  } catch (error) {
    console.error('Mood entry creation error:', error);
    res.status(500).json({ error: 'Failed to create mood entry' });
  }
});

// Get mood entries for current user (simplified endpoint)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await query(
      `SELECT id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at
       FROM mood_entries 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );

    // Get total count for pagination
    const countResult = await query(
      'SELECT COUNT(*) as total FROM mood_entries WHERE user_id = $1',
      [req.user.id]
    );

    // Convert snake_case to camelCase for frontend
    const moodEntries = result.rows.map(entry => ({
      id: entry.id,
      userId: req.user.id,
      moodLevel: entry.mood_level,
      notes: entry.notes,
      energyLevel: entry.energy_level,
      sleepHours: entry.sleep_hours,
      stressLevel: entry.stress_level,
      createdAt: entry.created_at
    }));

    res.json({
      moodEntries,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
        hasMore: result.rows.length === limit
      }
    });
  } catch (error) {
    console.error('Mood entries fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch mood entries' });
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

// Add sleep-only entry (simplified for daily sleep tracking)
router.post('/sleep', authenticateToken, [
  body('sleep_hours').isFloat({ min: 0, max: 24 }),
  body('sleep_quality').optional().isInt({ min: 1, max: 5 }),
  body('notes').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { sleep_hours, sleep_quality = 3, notes } = req.body;

    // Calculate energy based on sleep and goals
    const calculatedEnergy = await calculateEnergyLevel(req.user.id, sleep_hours, 0);

    // Create a mood entry with neutral mood but calculated energy
    const result = await query(
      `INSERT INTO mood_entries (user_id, mood_level, notes, energy_level, sleep_hours, stress_level)
       VALUES ($1, 'neutral', $2, $3, $4, 5)
       RETURNING id, mood_level, notes, energy_level, sleep_hours, stress_level, created_at`,
      [req.user.id, notes || `Slept ${sleep_hours} hours`, calculatedEnergy, sleep_hours]
    );

    const sleepEntry = {
      id: result.rows[0].id,
      userId: req.user.id,
      sleepHours: result.rows[0].sleep_hours,
      energyLevel: result.rows[0].energy_level,
      sleepQuality: sleep_quality,
      notes: result.rows[0].notes,
      createdAt: result.rows[0].created_at
    };

    res.status(201).json({
      message: 'Sleep entry created successfully',
      sleepEntry
    });
  } catch (error) {
    console.error('Sleep entry creation error:', error);
    res.status(500).json({ error: 'Failed to create sleep entry' });
  }
});

// Get sleep statistics
router.get('/sleep/stats', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    
    const result = await query(
      `SELECT 
         AVG(sleep_hours) as avg_sleep,
         MIN(sleep_hours) as min_sleep,
         MAX(sleep_hours) as max_sleep,
         COUNT(*) as total_entries,
         AVG(energy_level) as avg_energy
       FROM mood_entries 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'`,
      [req.user.id]
    );

    const sleepPattern = await query(
      `SELECT 
         DATE(created_at) as date,
         sleep_hours,
         energy_level
       FROM mood_entries 
       WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      period_days: days,
      stats: result.rows[0],
      sleepPattern: sleepPattern.rows
    });
  } catch (error) {
    console.error('Sleep stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch sleep statistics' });
  }
});

module.exports = router;
