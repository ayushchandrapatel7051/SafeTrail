import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// Generate unique share token
function generateShareToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create new live trip
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const {
      trip_name,
      start_location,
      destination,
      trusted_contacts,
      current_latitude,
      current_longitude,
    } = req.body;

    if (!trip_name || !start_location) {
      return res.status(400).json({ error: 'Trip name and start location are required' });
    }

    const shareToken = generateShareToken();

    const result = await query(
      `INSERT INTO live_trips (
        user_id, share_token, trip_name, start_location, destination,
        current_latitude, current_longitude, trusted_contacts, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
      RETURNING *`,
      [
        userId,
        shareToken,
        trip_name,
        start_location,
        destination,
        current_latitude,
        current_longitude,
        JSON.stringify(trusted_contacts || []),
      ]
    );

    const trip = result.rows[0];

    res.status(201).json({
      message: 'Live trip created successfully',
      trip: {
        id: trip.id,
        share_token: trip.share_token,
        share_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/live-trip/${trip.share_token}`,
        trip_name: trip.trip_name,
        start_location: trip.start_location,
        destination: trip.destination,
        is_active: trip.is_active,
        started_at: trip.started_at,
      },
    });
  } catch (error) {
    console.error('Error creating live trip:', error);
    res.status(500).json({ error: 'Failed to create live trip' });
  }
});

// Get user's active trips
router.get('/my-trips', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT * FROM live_trips 
       WHERE user_id = $1 AND is_active = true 
       ORDER BY started_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// Get trip by share token (public - no auth required)
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await query(
      `SELECT 
        lt.*,
        u.full_name as user_name
       FROM live_trips lt
       LEFT JOIN users u ON lt.user_id = u.id
       WHERE lt.share_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = result.rows[0];

    // Don't expose sensitive user data
    res.json({
      id: trip.id,
      trip_name: trip.trip_name,
      user_name: trip.user_name,
      start_location: trip.start_location,
      destination: trip.destination,
      current_latitude: trip.current_latitude,
      current_longitude: trip.current_longitude,
      is_active: trip.is_active,
      emergency_triggered: trip.emergency_triggered,
      emergency_message: trip.emergency_message,
      route_waypoints: trip.route_waypoints,
      started_at: trip.started_at,
      last_updated: trip.last_updated,
    });
  } catch (error) {
    console.error('Error fetching shared trip:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// Update trip location
router.put('/:id/location', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { latitude, longitude, route_waypoints } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Verify trip belongs to user
    const checkResult = await query('SELECT id FROM live_trips WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await query(
      `UPDATE live_trips 
       SET current_latitude = $1, 
           current_longitude = $2,
           route_waypoints = $3,
           last_updated = NOW()
       WHERE id = $4`,
      [latitude, longitude, JSON.stringify(route_waypoints || null), id]
    );

    res.json({ message: 'Location updated successfully' });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Trigger emergency
router.post('/:id/emergency', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { message } = req.body;

    // Verify trip belongs to user
    const checkResult = await query(
      'SELECT id, trusted_contacts FROM live_trips WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await query(
      `UPDATE live_trips 
       SET emergency_triggered = true,
           emergency_message = $1,
           last_updated = NOW()
       WHERE id = $2`,
      [message || 'Emergency button triggered', id]
    );

    // TODO: Send emergency notifications to trusted contacts
    // This would integrate with email service

    res.json({ message: 'Emergency triggered successfully' });
  } catch (error) {
    console.error('Error triggering emergency:', error);
    res.status(500).json({ error: 'Failed to trigger emergency' });
  }
});

// End trip
router.put('/:id/end', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Verify trip belongs to user
    const checkResult = await query('SELECT id FROM live_trips WHERE id = $1 AND user_id = $2', [
      id,
      userId,
    ]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    await query(
      `UPDATE live_trips 
       SET is_active = false,
           ended_at = NOW(),
           last_updated = NOW()
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Trip ended successfully' });
  } catch (error) {
    console.error('Error ending trip:', error);
    res.status(500).json({ error: 'Failed to end trip' });
  }
});

export default router;
