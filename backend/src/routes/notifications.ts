import { Router } from 'express';
import { query } from '../db/connection.js';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendEmail } from '../lib/email.js';

const router = Router();

// Get all notifications (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const result = await query(
      `SELECT 
        n.*,
        u.full_name as created_by_name
       FROM admin_notifications n
       LEFT JOIN users u ON n.created_by = u.id
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) as count FROM admin_notifications');

    res.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Create and send notification (admin only)
router.post('/send', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const adminId = req.user?.id;
    const {
      title,
      incident_type,
      message,
      recipient_emails,
      send_to_all_users,
      send_to_city_users,
    } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    // Insert notification record
    const notificationResult = await query(
      `INSERT INTO admin_notifications (
        created_by, title, incident_type, message, 
        recipient_emails, send_to_all_users, send_to_city_users, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'sending')
      RETURNING *`,
      [
        adminId,
        title,
        incident_type,
        message,
        recipient_emails || [],
        send_to_all_users || false,
        send_to_city_users || null,
      ]
    );

    const notification = notificationResult.rows[0];
    let recipientEmails: string[] = [];

    // Determine recipients
    if (send_to_all_users) {
      const usersResult = await query(
        'SELECT email FROM users WHERE email_verified = true AND role = $1',
        ['user']
      );
      recipientEmails = usersResult.rows.map((row) => row.email);
    } else if (send_to_city_users) {
      // Get users who have submitted reports in this city
      const usersResult = await query(
        `SELECT DISTINCT u.email 
         FROM users u
         JOIN reports r ON u.id = r.user_id
         JOIN places p ON r.place_id = p.id
         WHERE p.city_id = $1 AND u.email_verified = true`,
        [send_to_city_users]
      );
      recipientEmails = usersResult.rows.map((row) => row.email);
    } else if (recipient_emails && recipient_emails.length > 0) {
      recipientEmails = recipient_emails;
    } else {
      return res.status(400).json({
        error: 'Must specify recipients: recipient_emails, send_to_all_users, or send_to_city_users',
      });
    }

    // Send emails
    let successCount = 0;
    let failCount = 0;

    for (const email of recipientEmails) {
      try {
        await sendEmail({
          to: email,
          subject: `SafeTrail Alert: ${title}`,
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #ef4444;">SafeTrail Safety Alert</h2>
              <h3>${title}</h3>
              ${incident_type ? `<p><strong>Incident Type:</strong> ${incident_type}</p>` : ''}
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                ${message.replace(/\n/g, '<br>')}
              </div>
              <p style="color: #6b7280; font-size: 12px;">
                This is an automated notification from SafeTrail. 
                Please do not reply to this email.
              </p>
            </div>
          `,
        });
        successCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
        failCount++;
      }
    }

    // Update notification status
    await query(
      `UPDATE admin_notifications 
       SET status = 'sent', 
           sent_at = NOW(),
           recipient_emails = $1
       WHERE id = $2`,
      [recipientEmails, notification.id]
    );

    res.json({
      message: 'Notification sent successfully',
      notification_id: notification.id,
      recipients_count: recipientEmails.length,
      success_count: successCount,
      fail_count: failCount,
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Get notification by ID (admin only)
router.get('/:id', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      `SELECT 
        n.*,
        u.full_name as created_by_name
       FROM admin_notifications n
       LEFT JOIN users u ON n.created_by = u.id
       WHERE n.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ error: 'Failed to fetch notification' });
  }
});

export default router;
