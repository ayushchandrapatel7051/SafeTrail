import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
const router = Router();
// Get recent alerts
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0 } = req.query;
        const result = await query(`SELECT id, title, body, severity, location_type, location_id, created_by, created_at
       FROM alerts
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`, [limit, offset]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});
// Create alert (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { title, body, severity, location_type, location_id } = req.body;
        if (!title || !body || severity === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const result = await query(`INSERT INTO alerts (title, body, severity, location_type, location_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, body, severity, location_type, location_id, created_by, created_at`, [title, body, severity, location_type || null, location_id || null, req.user?.id]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
});
export default router;
//# sourceMappingURL=alerts.js.map