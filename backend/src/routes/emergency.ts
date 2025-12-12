import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Get emergency services by city
router.get('/city/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params;
    
    // Check cache
    const cacheKey = `emergency:city:${cityId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const result = await query(
      `SELECT 
        p.id as place_id,
        p.name as place_name,
        p.latitude as place_lat,
        p.longitude as place_lon,
        c.name as city_name,
        es.police_number,
        es.ambulance_number,
        es.fire_number,
        es.women_helpline,
        es.tourist_helpline,
        es.nearest_police_name,
        es.nearest_police_distance_m,
        es.nearest_police_lat,
        es.nearest_police_lon
       FROM emergency_services es
       JOIN places p ON es.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       WHERE p.city_id = $1
       ORDER BY p.name`,
      [cityId]
    );

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(result.rows), 3600);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emergency services:', error);
    res.status(500).json({ error: 'Failed to fetch emergency services' });
  }
});

// Get emergency services by place
router.get('/place/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    // Check cache
    const cacheKey = `emergency:place:${placeId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Get emergency services
    const emergencyResult = await query(
      `SELECT 
        p.id as place_id,
        p.name as place_name,
        p.latitude as place_lat,
        p.longitude as place_lon,
        c.name as city_name,
        c.id as city_id,
        es.*
       FROM emergency_services es
       JOIN places p ON es.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       WHERE es.place_id = $1`,
      [placeId]
    );

    if (emergencyResult.rows.length === 0) {
      return res.status(404).json({ error: 'Emergency services not found' });
    }

    const emergency = emergencyResult.rows[0];

    // Get hospitals
    const hospitalsResult = await query(
      `SELECT * FROM hospitals WHERE place_id = $1 ORDER BY distance_m`,
      [placeId]
    );

    const response = {
      ...emergency,
      hospitals: hospitalsResult.rows
    };

    // Cache for 1 hour
    await redis.set(cacheKey, JSON.stringify(response), 3600);

    res.json(response);
  } catch (error) {
    console.error('Error fetching emergency details:', error);
    res.status(500).json({ error: 'Failed to fetch emergency details' });
  }
});

// Search emergency services
router.get('/search', async (req, res) => {
  try {
    const { city, place } = req.query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (city) {
      whereClause += ` AND c.name ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }

    if (place) {
      whereClause += ` AND p.name ILIKE $${paramCount}`;
      params.push(`%${place}%`);
      paramCount++;
    }

    const result = await query(
      `SELECT 
        p.id as place_id,
        p.name as place_name,
        p.latitude as place_lat,
        p.longitude as place_lon,
        c.name as city_name,
        c.id as city_id,
        es.police_number,
        es.ambulance_number,
        es.fire_number,
        es.women_helpline,
        es.tourist_helpline
       FROM emergency_services es
       JOIN places p ON es.place_id = p.id
       JOIN cities c ON p.city_id = c.id
       ${whereClause}
       ORDER BY c.name, p.name
       LIMIT 50`,
      params
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error searching emergency services:', error);
    res.status(500).json({ error: 'Failed to search emergency services' });
  }
});

export default router;
