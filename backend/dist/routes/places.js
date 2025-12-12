import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';
const router = Router();
// Get all places with caching
router.get('/', async (req, res) => {
    try {
        // Check cache
        const cacheKey = 'places:all';
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const result = await query('SELECT id, city_id, name, latitude, longitude, type, safety_score, report_count FROM places ORDER BY name');
        // Cache for 1 hour
        await redis.set(cacheKey, result.rows, 3600);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching places:', error);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
});
// Get place by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `place:${id}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const result = await query('SELECT id, city_id, name, latitude, longitude, type, safety_score, report_count FROM places WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Place not found' });
        }
        const place = result.rows[0];
        // Get recent reports for this place
        const reportsResult = await query('SELECT id, type, description, status, created_at FROM reports WHERE place_id = $1 ORDER BY created_at DESC LIMIT 10', [id]);
        const placeWithReports = {
            ...place,
            recentReports: reportsResult.rows,
        };
        // Cache for 1 hour
        await redis.set(cacheKey, placeWithReports, 3600);
        res.json(placeWithReports);
    }
    catch (error) {
        console.error('Error fetching place:', error);
        res.status(500).json({ error: 'Failed to fetch place' });
    }
});
// Get places by city
router.get('/city/:cityId', async (req, res) => {
    try {
        const { cityId } = req.params;
        const cacheKey = `places:city:${cityId}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const result = await query('SELECT id, city_id, name, latitude, longitude, type, safety_score, report_count FROM places WHERE city_id = $1 ORDER BY name', [cityId]);
        await redis.set(cacheKey, result.rows, 3600);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching places by city:', error);
        res.status(500).json({ error: 'Failed to fetch places' });
    }
});
export default router;
//# sourceMappingURL=places.js.map