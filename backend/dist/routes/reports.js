import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';
import { updatePlaceSafetyScore, updateCitySafetyScore } from '../lib/safetyScore.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();
// Setup file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Invalid file type'));
        }
    },
});
// Create report
router.post('/', authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const { place_id, type, description, latitude, longitude, severity } = req.body;
        // Validate input
        if (!place_id || !type || !description || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Check if place exists
        const placeCheck = await query('SELECT id FROM places WHERE id = $1', [place_id]);
        if (placeCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Place not found' });
        }
        // Create report
        const result = await query(`INSERT INTO reports (user_id, place_id, type, description, latitude, longitude, severity, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, user_id, place_id, type, description, latitude, longitude, status, severity, created_at`, [req.user?.id || null, place_id, type, description, latitude, longitude, severity || 1, 'pending']);
        const report = result.rows[0];
        // Upload photo if provided
        if (req.file) {
            await query('INSERT INTO report_photos (report_id, file_path, file_name) VALUES ($1, $2, $3)', [report.id, req.file.path, req.file.originalname]);
        }
        // Invalidate caches
        await redis.delete(`place:${place_id}`);
        await redis.delete('places:all');
        res.status(201).json(report);
    }
    catch (error) {
        console.error('Error creating report:', error);
        res.status(500).json({ error: 'Failed to create report' });
    }
});
// Get reports (with filtering)
router.get('/', async (req, res) => {
    try {
        const { status, place_id, type, limit = 50, offset = 0 } = req.query;
        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 1;
        if (status) {
            whereClause += ` AND status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }
        if (place_id) {
            whereClause += ` AND place_id = $${paramCount}`;
            params.push(place_id);
            paramCount++;
        }
        if (type) {
            whereClause += ` AND type = $${paramCount}`;
            params.push(type);
            paramCount++;
        }
        // Add limit and offset
        params.push(limit);
        params.push(offset);
        const result = await query(`SELECT id, user_id, place_id, type, description, latitude, longitude, status, severity, created_at, updated_at, verified_at, verified_by
       FROM reports
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`, params);
        const countResult = await query(`SELECT COUNT(*) as total FROM reports ${whereClause}`, params.slice(0, -2));
        const total = parseInt(countResult.rows[0].total);
        res.json({
            reports: result.rows,
            total,
            limit: parseInt(limit),
            offset: parseInt(offset),
        });
    }
    catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Failed to fetch reports' });
    }
});
// Get report by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const reportResult = await query(`SELECT id, user_id, place_id, type, description, latitude, longitude, status, severity, created_at, updated_at, verified_at, verified_by
       FROM reports WHERE id = $1`, [id]);
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        // Get photos
        const photosResult = await query('SELECT id, file_path, file_name FROM report_photos WHERE report_id = $1', [id]);
        const report = {
            ...reportResult.rows[0],
            photos: photosResult.rows,
        };
        res.json(report);
    }
    catch (error) {
        console.error('Error fetching report:', error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});
// Verify report (admin only)
router.patch('/:id/verify', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        // Get report and place
        const reportResult = await query('SELECT place_id FROM reports WHERE id = $1', [id]);
        if (reportResult.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        const placeId = reportResult.rows[0].place_id;
        // Update report
        const result = await query(`UPDATE reports 
       SET status = $1, verified_at = CURRENT_TIMESTAMP, verified_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`, ['verified', req.user?.id, id]);
        // Recalculate safety scores
        await updatePlaceSafetyScore(placeId);
        // Get city id to update city score
        const placeInfoResult = await query('SELECT city_id FROM places WHERE id = $1', [placeId]);
        if (placeInfoResult.rows.length > 0) {
            await updateCitySafetyScore(placeInfoResult.rows[0].city_id);
        }
        // Invalidate caches
        await redis.delete(`place:${placeId}`);
        await redis.delete('places:all');
        await redis.delete(`city:${placeInfoResult.rows[0]?.city_id}`);
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error verifying report:', error);
        res.status(500).json({ error: 'Failed to verify report' });
    }
});
// Reject report (admin only)
router.patch('/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query(`UPDATE reports 
       SET status = $1, verified_at = CURRENT_TIMESTAMP, verified_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`, ['rejected', req.user?.id, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }
        // Invalidate cache
        await redis.delete('places:all');
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error rejecting report:', error);
        res.status(500).json({ error: 'Failed to reject report' });
    }
});
export default router;
//# sourceMappingURL=reports.js.map