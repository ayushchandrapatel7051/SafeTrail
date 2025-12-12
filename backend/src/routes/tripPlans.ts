import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { redis } from '../lib/redis.js';

const router = Router();

// Get all trip plans for logged-in user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT tp.*, c.name as city_name,
              COUNT(tpi.id) as item_count
       FROM trip_plans tp
       LEFT JOIN cities c ON tp.city_id = c.id
       LEFT JOIN trip_plan_items tpi ON tp.id = tpi.trip_plan_id
       WHERE tp.user_id = $1
       GROUP BY tp.id, c.name, tp.travelers
       ORDER BY tp.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trip plans:', error);
    res.status(500).json({ error: 'Failed to fetch trip plans' });
  }
});

// Get single trip plan with all items
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Get trip plan
    const planResult = await query(
      `SELECT tp.*, c.name as city_name
       FROM trip_plans tp
       LEFT JOIN cities c ON tp.city_id = c.id
       WHERE tp.id = $1 AND tp.user_id = $2`,
      [id, userId]
    );

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    const tripPlan = planResult.rows[0];

    // Get all items for this trip plan
    const itemsResult = await query(
      `SELECT tpi.*,
              COALESCE(p.name, a.name) as name,
              p.name as place_name, p.latitude as place_lat, p.longitude as place_lon,
              a.name as attraction_name, a.latitude as attraction_lat, a.longitude as attraction_lon,
              COALESCE(p.category, a.category) as category
       FROM trip_plan_items tpi
       LEFT JOIN places p ON tpi.place_id = p.id
       LEFT JOIN attractions a ON tpi.attraction_id = a.id
       WHERE tpi.trip_plan_id = $1
       ORDER BY tpi.day_number, tpi.order_index`,
      [id]
    );

    tripPlan.items = itemsResult.rows;

    res.json(tripPlan);
  } catch (error) {
    console.error('Error fetching trip plan:', error);
    res.status(500).json({ error: 'Failed to fetch trip plan' });
  }
});

// Create new trip plan
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { name, city_id, start_date, end_date, preferences, notes, items, travelers } = req.body;

    // Validate
    if (!name || !city_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create trip plan
    const planResult = await query(
      `INSERT INTO trip_plans (user_id, city_id, name, start_date, end_date, preferences, notes, travelers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        city_id,
        name,
        start_date,
        end_date,
        preferences || [],
        notes || null,
        JSON.stringify(travelers || []),
      ]
    );

    const tripPlan = planResult.rows[0];

    // Add items if provided
    if (items && items.length > 0) {
      for (const item of items) {
        await query(
          `INSERT INTO trip_plan_items 
           (trip_plan_id, place_id, attraction_id, day_number, time_slot, start_time, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            tripPlan.id,
            item.place_id || null,
            item.attraction_id || null,
            item.day_number,
            item.time_slot || null,
            item.start_time || null,
            item.notes || null,
            item.order_index,
          ]
        );
      }
    }

    // Fetch complete trip plan
    const completeResult = await query(
      `SELECT tp.*, c.name as city_name
       FROM trip_plans tp
       LEFT JOIN cities c ON tp.city_id = c.id
       WHERE tp.id = $1`,
      [tripPlan.id]
    );

    res.status(201).json(completeResult.rows[0]);
  } catch (error) {
    console.error('Error creating trip plan:', error);
    res.status(500).json({ error: 'Failed to create trip plan' });
  }
});

// Update trip plan
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, start_date, end_date, preferences, notes, items, travelers } = req.body;

    // Check ownership
    const checkResult = await query('SELECT id FROM trip_plans WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    // Update trip plan
    await query(
      `UPDATE trip_plans 
       SET name = $1, start_date = $2, end_date = $3, preferences = $4, notes = $5, travelers = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        name,
        start_date,
        end_date,
        preferences || [],
        notes || null,
        JSON.stringify(travelers || []),
        id,
      ]
    );

    // Delete existing items and add new ones
    if (items) {
      await query('DELETE FROM trip_plan_items WHERE trip_plan_id = $1', [id]);

      for (const item of items) {
        await query(
          `INSERT INTO trip_plan_items 
           (trip_plan_id, place_id, attraction_id, day_number, time_slot, start_time, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            id,
            item.place_id || null,
            item.attraction_id || null,
            item.day_number,
            item.time_slot || null,
            item.start_time || null,
            item.notes || null,
            item.order_index,
          ]
        );
      }
    }

    // Fetch updated trip plan
    const result = await query(
      `SELECT tp.*, c.name as city_name
       FROM trip_plans tp
       LEFT JOIN cities c ON tp.city_id = c.id
       WHERE tp.id = $1`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating trip plan:', error);
    res.status(500).json({ error: 'Failed to update trip plan' });
  }
});

// Delete trip plan
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await query(
      'DELETE FROM trip_plans WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip plan not found' });
    }

    res.json({ message: 'Trip plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip plan:', error);
    res.status(500).json({ error: 'Failed to delete trip plan' });
  }
});

export default router;
