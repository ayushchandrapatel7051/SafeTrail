import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendEmergencyEmail } from '../lib/email.js';

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
      hospitals: hospitalsResult.rows,
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

// Get user's emergency contacts
router.get('/contacts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM emergency_contacts WHERE user_id = $1 ORDER BY is_primary DESC, created_at ASC',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

// Add emergency contact
router.post('/contacts', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, email, relationship, is_primary } = req.body;

    if (!name || !email || !relationship) {
      return res.status(400).json({ error: 'Name, email, and relationship are required' });
    }

    const result = await query(
      `INSERT INTO emergency_contacts (user_id, name, email, relationship, is_primary)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user!.id, name, email, relationship, is_primary || false]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
});

// Update emergency contact
router.put('/contacts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, email, relationship, is_primary } = req.body;

    const result = await query(
      `UPDATE emergency_contacts 
       SET name = $1, email = $2, relationship = $3, is_primary = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND user_id = $6 RETURNING *`,
      [name, email, relationship, is_primary, id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ error: 'Failed to update emergency contact' });
  }
});

// Delete emergency contact
router.delete('/contacts/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ error: 'Failed to delete emergency contact' });
  }
});

// Get user's medical info
router.get('/medical-info', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query('SELECT medical_info FROM users WHERE id = $1', [req.user!.id]);
    res.json(result.rows[0]?.medical_info || {});
  } catch (error) {
    console.error('Error fetching medical info:', error);
    res.status(500).json({ error: 'Failed to fetch medical info' });
  }
});

// Update medical info
router.put('/medical-info', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const medicalInfo = req.body;

    await query('UPDATE users SET medical_info = $1 WHERE id = $2', [
      JSON.stringify(medicalInfo),
      req.user!.id,
    ]);

    res.json({ message: 'Medical info updated successfully' });
  } catch (error) {
    console.error('Error updating medical info:', error);
    res.status(500).json({ error: 'Failed to update medical info' });
  }
});

// Trigger SOS alert
router.post('/sos', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { location, message } = req.body;

    if (!location || !location.latitude || !location.longitude) {
      return res.status(400).json({ error: 'Location is required' });
    }

    // Create SOS alert
    const alertResult = await query(
      `INSERT INTO sos_alerts (user_id, location, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [req.user!.id, JSON.stringify(location), message || 'Emergency! I need immediate help!']
    );

    // Get user info and emergency contacts
    const userResult = await query('SELECT full_name, email FROM users WHERE id = $1', [
      req.user!.id,
    ]);
    const contactsResult = await query('SELECT * FROM emergency_contacts WHERE user_id = $1', [
      req.user!.id,
    ]);

    const user = userResult.rows[0];
    const contacts = contactsResult.rows;

    const locationUrl = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;

    console.log('🚨 SOS ALERT TRIGGERED 🚨');
    console.log(`User: ${user.full_name} (${user.email})`);
    console.log(`Location: ${location.latitude}, ${location.longitude}`);
    console.log(`Message: ${message || 'Emergency! I need immediate help!'}`);
    console.log(`Google Maps: ${locationUrl}`);
    console.log(`Emergency Contacts: ${contacts.length}`);

    // Send emails to all emergency contacts (non-blocking)
    if (contacts.length > 0) {
      const emailPromises = contacts.map(async (contact) => {
        console.log(`  - Notifying ${contact.name} (${contact.relationship}): ${contact.email}`);
        try {
          await sendEmergencyEmail({
            to: contact.email,
            contactName: contact.name,
            userName: user.full_name,
            userEmail: user.email,
            message: message || 'Emergency! I need immediate help!',
            locationUrl,
            latitude: location.latitude,
            longitude: location.longitude,
          });
          console.log(`  ✓ Email sent to ${contact.email}`);
        } catch (error) {
          console.error(`  ✗ Failed to send email to ${contact.email}:`, error);
          // Don't throw - continue with other emails
        }
      });

      // Don't wait for all emails - send response immediately
      Promise.allSettled(emailPromises).catch((err) => {
        console.error('Error sending some emergency emails:', err);
      });
    } else {
      console.log('⚠️ No emergency contacts found - alert created but no emails sent');
    }

    // Always return success once alert is created, regardless of email status
    res.json({
      success: true,
      alert: alertResult.rows[0],
      contactsNotified: contacts.length,
    });
  } catch (error) {
    console.error('SOS error:', error);
    res.status(500).json({
      error: 'Failed to trigger SOS alert',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get SOS alerts history
router.get('/sos/history', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT * FROM sos_alerts WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20',
      [req.user!.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching SOS history:', error);
    res.status(500).json({ error: 'Failed to fetch SOS history' });
  }
});

export default router;
