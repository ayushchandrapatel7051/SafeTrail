import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Get all attractions
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'attractions:all';
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await query(
      `SELECT id, city_id, name, description, category, latitude, longitude, 
              rating, estimated_duration, best_time_to_visit, entry_fee
       FROM attractions
       ORDER BY rating DESC, name`
    );

    await redis.set(cacheKey, result.rows, 3600);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attractions:', error);
    res.status(500).json({ error: 'Failed to fetch attractions' });
  }
});

// Get attractions by city
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;

    const cacheKey = `attractions:city:${cityId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await query(
      `SELECT id, city_id, name, description, category, latitude, longitude, 
              rating, estimated_duration, best_time_to_visit, entry_fee
       FROM attractions
       WHERE city_id = $1
       ORDER BY rating DESC, name`,
      [cityId]
    );

    await redis.set(cacheKey, result.rows, 3600);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attractions by city:', error);
    res.status(500).json({ error: 'Failed to fetch attractions' });
  }
});

// Get attraction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const cacheKey = `attraction:${id}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const result = await query(
      `SELECT id, city_id, name, description, category, latitude, longitude, 
              rating, estimated_duration, best_time_to_visit, entry_fee
       FROM attractions
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attraction not found' });
    }

    await redis.set(cacheKey, result.rows[0], 3600);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching attraction:', error);
    res.status(500).json({ error: 'Failed to fetch attraction' });
  }
});

export default router;
