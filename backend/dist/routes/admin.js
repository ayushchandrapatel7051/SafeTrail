import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
const router = Router();
// Admin dashboard stats
router.get('/dashboard', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Get pending reports count
        const pendingResult = await query('SELECT COUNT(*) as count FROM reports WHERE status = $1', [
            'pending',
        ]);
        // Get verified reports count
        const verifiedResult = await query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['verified']);
        // Get total places
        const placesResult = await query('SELECT COUNT(*) as count FROM places');
        // Get total cities
        const citiesResult = await query('SELECT COUNT(*) as count FROM cities');
        // Get cities with lowest safety scores
        const unsafeResult = await query(`SELECT id, name, safety_score FROM cities ORDER BY safety_score ASC LIMIT 5`);
        // Get high severity verified reports
        const criticalResult = await query(`SELECT r.id, r.type, r.description, p.name as place_name, r.severity, r.verified_at
       FROM reports r
       JOIN places p ON r.place_id = p.id
       WHERE r.status = $1 AND r.severity >= $2
       ORDER BY r.created_at DESC
       LIMIT 10`, ['verified', 3]);
        res.json({
            stats: {
                pendingReports: parseInt(pendingResult.rows[0].count),
                verifiedReports: parseInt(verifiedResult.rows[0].count),
                totalPlaces: parseInt(placesResult.rows[0].count),
                totalCities: parseInt(citiesResult.rows[0].count),
            },
            unsafeCities: unsafeResult.rows,
            criticalReports: criticalResult.rows,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});
// Get pending reports for moderation
router.get('/reports/pending', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;
        const result = await query(`SELECT r.id, r.user_id, r.place_id, 
              p.name as place_name, 
              c.name as city_name,
              u.full_name as reporter_name,
              u.email as reporter_email,
              r.type, r.description, 
              r.latitude, r.longitude, r.severity, r.status, r.created_at,
              COUNT(rp.id) as photo_count
       FROM reports r
       JOIN places p ON r.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN report_photos rp ON r.id = rp.report_id
       WHERE r.status = $1
       GROUP BY r.id, p.name, c.name, u.full_name, u.email
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`, ['pending', limit, offset]);
        const countResult = await query('SELECT COUNT(*) as total FROM reports WHERE status = $1', [
            'pending',
        ]);
        res.json({
            reports: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit,
            offset,
        });
    }
    catch (error) {
        console.error('Error fetching pending reports:', error);
        res.status(500).json({ error: 'Failed to fetch pending reports' });
    }
});
// Get report statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        // Reports by type
        const typeStatsResult = await query(`SELECT type, COUNT(*) as count, 
              COUNT(*) FILTER (WHERE status = 'verified') as verified_count
       FROM reports
       GROUP BY type
       ORDER BY count DESC`);
        // Reports by city
        const cityStatsResult = await query(`SELECT c.id, c.name, COUNT(r.id) as report_count,
              COUNT(r.id) FILTER (WHERE r.status = 'verified') as verified_count
       FROM cities c
       LEFT JOIN places p ON c.id = p.city_id
       LEFT JOIN reports r ON p.id = r.place_id
       GROUP BY c.id, c.name
       ORDER BY report_count DESC`);
        res.json({
            byType: typeStatsResult.rows,
            byCity: cityStatsResult.rows,
        });
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});
export default router;
//# sourceMappingURL=admin.js.map