# SafeTrail Emergency SOS System

## Overview
The SafeTrail Emergency SOS system allows users to trigger emergency alerts that automatically notify their designated emergency contacts via email with their current GPS location.

## Features
- ✅ Email-only emergency contacts (no phone numbers required)
- ✅ SOS button on Dashboard and Emergency pages
- ✅ Automatic email alerts with Google Maps location link
- ✅ Medical information storage for first responders
- ✅ Emergency alert history tracking
- ✅ Beautiful HTML email templates with emergency formatting

## SMTP Configuration

### Environment Variables
Add these to your `.env` file in the backend folder:

```env
# SMTP Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SafeTrail Emergency <noreply@safetrail.com>

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173
```

### Gmail Setup (Recommended)
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password:
   - Go to Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Name it "SafeTrail"
   - Copy the 16-character password
4. Use this password in `SMTP_PASS`

### Other SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-access-key
SMTP_PASS=your-ses-secret-key
```

#### Outlook/Office365
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

## Database Schema

### emergency_contacts
```sql
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  relationship VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### sos_alerts
```sql
CREATE TABLE sos_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  location JSONB NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'active',
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### users.medical_info (JSONB field)
```json
{
  "blood_type": "A+",
  "allergies": "Penicillin",
  "medications": "Aspirin 100mg daily",
  "conditions": "Type 2 Diabetes",
  "emergency_notes": "Insulin dependent"
}
```

## API Endpoints

### Emergency Contacts
- `GET /api/emergency/contacts` - Get user's emergency contacts
- `POST /api/emergency/contacts` - Add new contact
- `PUT /api/emergency/contacts/:id` - Update contact
- `DELETE /api/emergency/contacts/:id` - Delete contact

### Medical Info
- `GET /api/emergency/medical-info` - Get user's medical information
- `PUT /api/emergency/medical-info` - Update medical information

### SOS Alerts
- `POST /api/emergency/sos` - Trigger SOS alert
- `GET /api/emergency/sos/history` - Get alert history

## SOS Email Template
When a user triggers an SOS alert, emergency contacts receive an email containing:
- 🚨 Emergency alert header
- User's name and email
- Emergency message
- GPS coordinates (latitude/longitude)
- Google Maps link with location
- Timestamp of alert
- Action steps for the contact

## Testing the System

1. **Start the backend:**
```bash
cd backend
npm run dev
```

2. **Start the frontend:**
```bash
cd frontend
npm run dev
```

3. **Add emergency contacts:**
   - Go to Emergency page
   - Click "Add Contact"
   - Enter name, email, and relationship

4. **Test SOS alert:**
   - Click the SOS Emergency button (Dashboard or Emergency page)
   - Confirm the alert
   - Allow location access
   - Check your emergency contact's email inbox

## Email Sending Logs
The backend logs all email attempts:
- ✅ Success: `Email sent successfully to email@example.com. Message ID: xxx`
- ❌ Failure: `Failed to send email to email@example.com: error details`

## Security Notes
- Emails are sent asynchronously (non-blocking)
- Failed email deliveries don't prevent SOS alert creation
- Location data is only shared when explicitly triggered
- Medical information is stored encrypted in JSONB format
- All emergency endpoints require authentication

## Future Enhancements
- [ ] SMS integration via Twilio (optional)
- [ ] Push notifications via Firebase
- [ ] WhatsApp integration
- [ ] Emergency services auto-dial
- [ ] Geofencing alerts
- [ ] Trusted contact location sharing
