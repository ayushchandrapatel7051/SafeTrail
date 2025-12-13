import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Get user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT id, email, full_name, role, email_verified, created_at, updated_at 
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.json({
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { full_name } = req.body;

    if (!full_name) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const result = await query(
      `UPDATE users 
       SET full_name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id, email, full_name, role, email_verified, created_at, updated_at`,
      [full_name, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Get current password hash
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      newPasswordHash,
      userId,
    ]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user statistics
router.get('/stats', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    // Get reports count
    const reportsResult = await query(
      'SELECT COUNT(*) as count FROM reports WHERE user_id = $1',
      [userId]
    );
    const reportsCount = parseInt(reportsResult.rows[0].count);

    // Get verified reports count
    const verifiedReportsResult = await query(
      'SELECT COUNT(*) as count FROM reports WHERE user_id = $1 AND status = $2',
      [userId, 'verified']
    );
    const verifiedReportsCount = parseInt(verifiedReportsResult.rows[0].count);

    // Get unique cities from user's reports
    const citiesResult = await query(
      `SELECT COUNT(DISTINCT p.city_id) as count 
       FROM reports r 
       JOIN places p ON r.place_id = p.id 
       WHERE r.user_id = $1`,
      [userId]
    );
    const citiesVisited = parseInt(citiesResult.rows[0].count);

    // Get unique places from user's reports
    const placesResult = await query(
      'SELECT COUNT(DISTINCT place_id) as count FROM reports WHERE user_id = $1',
      [userId]
    );
    const placesChecked = parseInt(placesResult.rows[0].count);

    res.json({
      reports_submitted: reportsCount,
      verified_reports: verifiedReportsCount,
      cities_visited: citiesVisited,
      places_checked: placesChecked,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get user reports
router.get('/reports', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { limit = 10, offset = 0 } = req.query;

    const result = await query(
      `SELECT 
        r.id, r.type, r.description, r.status, r.severity, r.created_at,
        p.id as place_id, p.name as place_name, 
        c.id as city_id, c.name as city_name
       FROM reports r
       JOIN places p ON r.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await query('SELECT COUNT(*) as count FROM reports WHERE user_id = $1', [
      userId,
    ]);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      reports: result.rows,
      total: totalCount,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get user reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Delete account
router.delete('/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required to delete account' });
    }

    // Verify password
    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Delete user (cascade will handle related records)
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
