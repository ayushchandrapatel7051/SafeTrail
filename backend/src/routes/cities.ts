import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Get all cities
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'cities:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await query(
      'SELECT id, country_id, name, latitude, longitude, safety_score, places_count, reports_count FROM cities ORDER BY name'
    );

    // Cache for 1 hour
    await redis.set(cacheKey, result.rows, 3600);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get city by ID with stats
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `city:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const cityResult = await query(
      'SELECT id, country_id, name, latitude, longitude, safety_score, places_count, reports_count FROM cities WHERE id = $1',
      [id]
    );

    if (cityResult.rows.length === 0) {
      return res.status(404).json({ error: 'City not found' });
    }

    const city = cityResult.rows[0];

    // Get places in city
    const placesResult = await query(
      'SELECT id, name, latitude, longitude, type, safety_score, report_count FROM places WHERE city_id = $1',
      [id]
    );

    // Get recent alerts for city
    const alertsResult = await query(
      'SELECT id, title, body, severity, created_at FROM alerts WHERE location_type = $1 OR location_id = $2 ORDER BY created_at DESC LIMIT 5',
      ['city', id]
    );

    const cityWithDetails = {
      ...city,
      places: placesResult.rows,
      alerts: alertsResult.rows,
    };

    // Cache for 1 hour
    await redis.set(cacheKey, cityWithDetails, 3600);

    res.json(cityWithDetails);
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
});

export default router;
