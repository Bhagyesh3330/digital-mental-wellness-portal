const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, authorizeOwnerOrRole } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const goalValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('target_date').optional().isISO8601()
];

// Create wellness goal
router.post('/', authenticateToken, goalValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, description, target_date } = req.body;

    const result = await query(
      `INSERT INTO wellness_goals (user_id, title, description, target_date)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, description, target_date, is_completed, progress_percentage, created_at`,
      [req.user.id, title, description, target_date]
    );

    const goalData = result.rows[0];
    res.status(201).json({
      message: 'Wellness goal created successfully',
      goal: {
        id: goalData.id,
        title: goalData.title,
        description: goalData.description,
        targetDate: goalData.target_date,
        isCompleted: goalData.is_completed,
        progressPercentage: goalData.progress_percentage,
        createdAt: goalData.created_at
      }
    });
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Get goals for user
router.get('/user/:userId', authenticateToken, authorizeOwnerOrRole(), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await query(
      `SELECT id, title, description, target_date, is_completed, progress_percentage, created_at, updated_at
       FROM wellness_goals 
       WHERE user_id = $1 
       ORDER BY is_completed ASC, created_at DESC`,
      [userId]
    );

    // Map database column names to camelCase
    const goals = result.rows.map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetDate: goal.target_date,
      isCompleted: goal.is_completed,
      progressPercentage: goal.progress_percentage,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    }));

    res.json({ goals });
  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Get goals statistics
router.get('/user/:userId/stats', authenticateToken, authorizeOwnerOrRole(), async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const result = await query(
      `SELECT 
         COUNT(*) as total_goals,
         COUNT(*) FILTER (WHERE is_completed = true) as completed_goals,
         COUNT(*) FILTER (WHERE is_completed = false AND progress_percentage > 0) as in_progress,
         COUNT(*) FILTER (WHERE is_completed = false AND target_date < CURRENT_DATE) as overdue,
         AVG(progress_percentage) as avg_progress
       FROM wellness_goals 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    
    res.json({
      totalGoals: parseInt(stats.total_goals) || 0,
      completedGoals: parseInt(stats.completed_goals) || 0,
      inProgress: parseInt(stats.in_progress) || 0,
      overdue: parseInt(stats.overdue) || 0,
      averageProgress: parseFloat(stats.avg_progress) || 0
    });
  } catch (error) {
    console.error('Goals stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch goals statistics' });
  }
});

// Update goal progress
router.put('/:id/progress', authenticateToken, async (req, res) => {
  try {
    const goalId = req.params.id;
    const { progress_percentage, progress_note } = req.body;

    // Validate progress percentage
    if (progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({ error: 'Progress percentage must be between 0 and 100' });
    }

    // Check if goal exists and belongs to user
    const existing = await query(
      'SELECT user_id, is_completed FROM wellness_goals WHERE id = $1',
      [goalId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (existing.rows[0].user_id !== req.user.id && !['admin', 'counselor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update goal and add progress entry
    const is_completed = progress_percentage >= 100;
    
    await query(
      `UPDATE wellness_goals 
       SET progress_percentage = $1, is_completed = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [progress_percentage, is_completed, goalId]
    );

    // Add progress tracking entry if note provided
    if (progress_note) {
      await query(
        `INSERT INTO goal_progress (goal_id, progress_note, progress_value)
         VALUES ($1, $2, $3)`,
        [goalId, progress_note, progress_percentage]
      );
    }

    res.json({
      message: 'Goal progress updated successfully',
      progress_percentage,
      is_completed
    });
  } catch (error) {
    console.error('Goal progress update error:', error);
    res.status(500).json({ error: 'Failed to update goal progress' });
  }
});

module.exports = router;
