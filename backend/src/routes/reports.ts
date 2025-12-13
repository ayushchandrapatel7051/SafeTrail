import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';
import {
  updatePlaceSafetyScore,
  updateCitySafetyScore,
  updatePlaceReportCount,
  updateCityReportCount,
} from '../lib/safetyScore.js';
import { updateUserTrustScore } from '../lib/trustScore.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
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
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

interface CreateReportBody {
  place_id: number;
  type: string;
  description: string;
  latitude: number;
  longitude: number;
  severity?: number;
  is_anonymous?: boolean;
}

// Create report
router.post(
  '/',
  authMiddleware,
  upload.single('photo'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { place_id, type, description, latitude, longitude, severity, is_anonymous } =
        req.body as CreateReportBody;

      // Validate input
      if (!place_id || !type || !description || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if place exists
      const placeCheck = await query('SELECT id FROM places WHERE id = $1', [place_id]);
      if (placeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Place not found' });
      }

      // Get user's current trust score
      let userTrustScore = 50; // Default for anonymous
      if (req.user?.id && !is_anonymous) {
        const userResult = await query('SELECT trust_score FROM users WHERE id = $1', [
          req.user.id,
        ]);
        if (userResult.rows.length > 0) {
          userTrustScore = userResult.rows[0].trust_score || 50;
        }
      }

      // Create report
      const result = await query(
        `INSERT INTO reports (
          user_id, place_id, type, description, latitude, longitude, 
          severity, status, is_anonymous, reporter_trust_score
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, user_id, place_id, type, description, latitude, longitude, 
                  status, severity, is_anonymous, reporter_trust_score, created_at`,
        [
          is_anonymous ? null : req.user?.id || null,
          place_id,
          type,
          description,
          latitude,
          longitude,
          severity || 1,
          'pending',
          is_anonymous || false,
          userTrustScore,
        ]
      );

      const report = result.rows[0];

      // Upload photo if provided
      if (req.file) {
        await query(
          'INSERT INTO report_photos (report_id, file_path, file_name) VALUES ($1, $2, $3)',
          [report.id, req.file.path, req.file.originalname]
        );
      }

      // Update report counts
      await updatePlaceReportCount(place_id);

      // Get city id and update city report count
      const placeResult = await query('SELECT city_id FROM places WHERE id = $1', [place_id]);
      if (placeResult.rows.length > 0) {
        await updateCityReportCount(placeResult.rows[0].city_id);
      }

      // Invalidate caches
      await redis.delete(`place:${place_id}`);
      await redis.delete('places:all');
      await redis.delete('cities:all');
      if (placeResult.rows[0]?.city_id) {
        await redis.delete(`city:${placeResult.rows[0].city_id}`);
      }

      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// Get reports (with filtering)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, place_id, type, limit = 50, offset = 0 } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND r.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (place_id) {
      whereClause += ` AND r.place_id = $${paramCount}`;
      params.push(place_id);
      paramCount++;
    }

    if (type) {
      whereClause += ` AND r.type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }

    // Add limit and offset
    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT r.id, r.user_id, r.place_id, 
              p.name as place_name,
              c.name as city_name,
              u.full_name as reporter_name,
              u.email as reporter_email,
              r.type, r.description, r.latitude, r.longitude, 
              r.status, r.severity, r.is_anonymous, r.reporter_trust_score,
              r.created_at, r.updated_at, r.verified_at, r.verified_by,
              (SELECT rp.file_path FROM report_photos rp WHERE rp.report_id = r.id LIMIT 1) as photo_path
       FROM reports r
       JOIN places p ON r.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) as total 
       FROM reports r
       JOIN places p ON r.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       ${whereClause}`,
      params.slice(0, -2)
    );
    const total = parseInt(countResult.rows[0].total);

    res.json({
      reports: result.rows,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get report by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const reportResult = await query(
      `SELECT r.id, r.user_id, r.place_id,
              p.name as place_name,
              c.name as city_name,
              u.full_name as reporter_name,
              u.email as reporter_email,
              r.type, r.description, r.latitude, r.longitude, 
              r.status, r.severity, r.is_anonymous, r.reporter_trust_score,
              r.created_at, r.updated_at, r.verified_at, r.verified_by
       FROM reports r
       JOIN places p ON r.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Get photos
    const photosResult = await query(
      'SELECT id, file_path, file_name FROM report_photos WHERE report_id = $1',
      [id]
    );

    const report = {
      ...reportResult.rows[0],
      photos: photosResult.rows,
    };

    res.json(report);
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Verify report (admin only)
router.patch(
  '/:id/verify',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get report and place
      const reportResult = await query(
        'SELECT place_id, user_id, is_anonymous FROM reports WHERE id = $1',
        [id]
      );
      if (reportResult.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const { place_id: placeId, user_id: userId, is_anonymous } = reportResult.rows[0];

      // Update report
      const result = await query(
        `UPDATE reports 
       SET status = $1, verified_at = CURRENT_TIMESTAMP, verified_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
        ['verified', req.user.id, id]
      );

      // Update user's trust score if not anonymous
      if (userId && !is_anonymous) {
        await updateUserTrustScore(userId);
      }

      // Recalculate safety scores
      await updatePlaceSafetyScore(placeId);

      // Get city id to update city score and counts
      const placeInfoResult = await query('SELECT city_id FROM places WHERE id = $1', [placeId]);
      if (placeInfoResult.rows.length > 0) {
        await updateCitySafetyScore(placeInfoResult.rows[0].city_id);
        await updateCityReportCount(placeInfoResult.rows[0].city_id);
      }

      // Invalidate caches
      await redis.delete(`place:${placeId}`);
      await redis.delete('places:all');
      await redis.delete('cities:all');
      await redis.delete(`city:${placeInfoResult.rows[0]?.city_id}`);

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error verifying report:', error);
      res.status(500).json({ error: 'Failed to verify report' });
    }
  }
);

// Reject report (admin only)
router.patch(
  '/:id/reject',
  authMiddleware,
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user?.id) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get report user_id to update trust score
      const reportResult = await query('SELECT user_id, is_anonymous FROM reports WHERE id = $1', [
        id,
      ]);
      if (reportResult.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
      }

      const { user_id: userId, is_anonymous } = reportResult.rows[0];

      const result = await query(
        `UPDATE reports 
       SET status = $1, verified_at = CURRENT_TIMESTAMP, verified_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
        ['rejected', req.user.id, id]
      );

      // Update user's trust score if not anonymous (rejected reports lower score)
      if (userId && !is_anonymous) {
        await updateUserTrustScore(userId);
      }

      // Invalidate cache
      await redis.delete('places:all');

      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error rejecting report:', error);
      res.status(500).json({ error: 'Failed to reject report' });
    }
  }
);

export default router;
