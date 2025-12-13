# SafeTrail Advanced Features Implementation

## Overview
This document describes the newly implemented trust score system, anonymous reporting, live trip sharing, and admin notification features.

## 1. Trust Score System

### Database Schema
**Users Table - New Columns:**
- `trust_score` (INTEGER, default: 50) - Dynamic score from 0-100
- `verified_reports_count` (INTEGER, default: 0) - Count of verified reports

**Reports Table - New Columns:**
- `is_anonymous` (BOOLEAN, default: false) - Whether report was submitted anonymously
- `reporter_trust_score` (INTEGER) - User's trust score at time of submission

### Trust Score Calculation Algorithm

The trust score is calculated based on multiple factors:

1. **Base Score**: 50 (starting point for all users)
2. **Verified Reports**: +5 points per verified report
3. **Rejected Reports**: -3 points per rejected report
4. **Photo Evidence**: +2 points for reports with photos
5. **Accuracy Bonus**: Up to +10 points for high report accuracy (>80% verified)

**Scoring Formula:**
```
trust_score = 50 
            + (verified_reports × 5) 
            - (rejected_reports × 3) 
            + (reports_with_photos × 2) 
            + accuracy_bonus
```

**Capped at**: Minimum 0, Maximum 100

### Trust Score Weight System

Trust scores affect safety calculations with a weight multiplier:

| Trust Score Range | Weight Multiplier | Impact |
|-------------------|-------------------|---------|
| 0-29 | 0.5x | Low credibility |
| 30-49 | 0.75x | Below average |
| 50-69 | 1.0x | Normal weight |
| 70-89 | 1.5x | High credibility |
| 90-100 | 2.0x | Very high credibility |

### API Endpoints

#### Calculate Trust Score
The system automatically updates trust scores when:
- A report is verified (verified/rejected)
- Admin approves or rejects a report

**Function**: `updateUserTrustScore(userId: number)`

#### Get Weighted Safety Score
```typescript
// Applies trust weighting to place safety calculations
calculateWeightedSafetyScore(placeId: number): Promise<number>
```

### Integration Points

1. **Report Submission** (`POST /api/reports`):
   - Captures user's current trust score
   - Stores it with the report

2. **Report Verification** (`PATCH /api/reports/:id/verify`):
   - Triggers trust score recalculation
   - Updates verified_reports_count

3. **Report Rejection** (`PATCH /api/reports/:id/reject`):
   - Decreases user's trust score
   - Affects future report weights

---

## 2. Anonymous Reporting

### Purpose
Allows users to submit sensitive reports without revealing their identity while maintaining moderation controls.

### Database Changes
**Reports Table:**
- `is_anonymous` (BOOLEAN) - Flag for anonymous reports
- Anonymous reports have `user_id` set to NULL

### API Usage

#### Submit Anonymous Report
```javascript
POST /api/reports
Content-Type: multipart/form-data

{
  "place_id": 123,
  "type": "harassment",
  "description": "Incident details...",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "severity": 3,
  "is_anonymous": true  // Key flag
}
```

### Features
- Identity Protection: User's name and email hidden
- Default Trust Score: Anonymous reports use default score of 50
- Moderation: All anonymous reports still require admin verification
- No Trust Score Impact: Anonymous reports don't affect user's trust score

### Limitations
- Cannot build user reputation through anonymous reports
- Lower initial credibility weight (default 50)
- Still subject to admin moderation

---

## 3. Live Trip Sharing

### Database Schema
**live_trips Table:**
```sql
CREATE TABLE live_trips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  share_token VARCHAR(100) UNIQUE NOT NULL,
  current_location JSONB,
  route JSONB,
  emergency_triggered BOOLEAN DEFAULT false,
  trusted_contacts JSONB,
  status VARCHAR(50) DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Features

#### 1. Create Live Trip
```javascript
POST /api/live-trips
Authorization: Bearer <token>

{
  "name": "Weekend Hike",
  "destination": "Mountain Trail",
  "route": {
    "waypoints": [
      { "lat": 40.7128, "lng": -74.0060, "name": "Start" },
      { "lat": 40.7580, "lng": -73.9855, "name": "Checkpoint" }
    ]
  },
  "trusted_contacts": [
    { "name": "John Doe", "email": "john@example.com", "phone": "+1234567890" }
  ]
}

Response:
{
  "id": 1,
  "share_token": "abc123xyz789",
  "share_link": "https://safetrail.com/live/abc123xyz789"
}
```

#### 2. View Shared Trip (Public)
```javascript
GET /api/live-trips/shared/:token
// No authentication required

Response:
{
  "name": "Weekend Hike",
  "destination": "Mountain Trail",
  "current_location": { "lat": 40.7128, "lng": -74.0060 },
  "route": { ... },
  "status": "active",
  "emergency_triggered": false,
  "last_updated": "2024-01-15T10:30:00Z"
}
```

#### 3. Update Current Location
```javascript
PUT /api/live-trips/:id/location
Authorization: Bearer <token>

{
  "latitude": 40.7580,
  "longitude": -73.9855,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 4. Trigger Emergency
```javascript
POST /api/live-trips/:id/emergency
Authorization: Bearer <token>

{
  "message": "Need immediate help!"
}

// Automatically:
// - Sets emergency_triggered = true
// - Notifies all trusted contacts via email
// - Broadcasts WebSocket alert
```

#### 5. End Trip
```javascript
PUT /api/live-trips/:id/end
Authorization: Bearer <token>

Response:
{
  "message": "Trip ended successfully",
  "duration_minutes": 120
}
```

### Security Features
- Unique share tokens (UUID-based)
- Token-based access (no authentication needed for viewing)
- Only trip owner can update location
- Only trip owner can trigger emergency
- Trip data expires when ended

---

## 4. Admin Notification System

### Database Schema
**admin_notifications Table:**
```sql
CREATE TABLE admin_notifications (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  incident_type VARCHAR(100),
  recipient_emails TEXT[],
  send_to_all_users BOOLEAN DEFAULT false,
  send_to_city_users INTEGER REFERENCES cities(id),
  status VARCHAR(50) DEFAULT 'draft',
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### API Endpoints

#### 1. Send Notification (Admin Only)
```javascript
POST /api/notifications/send
Authorization: Bearer <admin-token>

{
  "title": "Safety Alert: Heavy Rain Warning",
  "incident_type": "weather",
  "message": "Heavy rain expected in the area. Please take necessary precautions.",
  
  // Choose ONE of these recipient options:
  "send_to_all_users": true,
  // OR
  "send_to_city_users": 5,  // City ID
  // OR
  "recipient_emails": ["user1@example.com", "user2@example.com"]
}

Response:
{
  "message": "Notification sent successfully",
  "notification_id": 123,
  "recipients_count": 150,
  "success_count": 148,
  "fail_count": 2
}
```

#### 2. Get All Notifications (Admin Only)
```javascript
GET /api/notifications?limit=20&offset=0
Authorization: Bearer <admin-token>

Response:
{
  "notifications": [
    {
      "id": 123,
      "title": "Safety Alert",
      "message": "...",
      "status": "sent",
      "recipients_count": 150,
      "sent_at": "2024-01-15T10:00:00Z",
      "created_by_name": "Admin User"
    }
  ],
  "total": 50
}
```

#### 3. Get Notification Details
```javascript
GET /api/notifications/:id
Authorization: Bearer <admin-token>

Response:
{
  "id": 123,
  "title": "Safety Alert",
  "message": "Full message content...",
  "incident_type": "weather",
  "recipient_emails": ["user1@example.com", ...],
  "status": "sent",
  "sent_at": "2024-01-15T10:00:00Z"
}
```

### Email Template
Notifications are sent with a professionally formatted HTML email:

```
Subject: SafeTrail Alert: [Title]

SafeTrail Safety Alert
[Title]

Incident Type: [Type]

[Message Content]

This is an automated notification from SafeTrail.
Please do not reply to this email.
```

### Recipient Selection Options

1. **All Users**: Send to all verified email addresses
2. **City-Specific**: Send to users who have submitted reports in a specific city
3. **Custom List**: Send to specific email addresses

---

## Testing the Features

### 1. Test Trust Score System

```bash
# Create a report (captures trust score)
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": 1,
    "type": "incident",
    "description": "Test report",
    "latitude": 40.7128,
    "longitude": -74.0060
  }'

# Verify the report (updates trust score)
curl -X PATCH http://localhost:3000/api/reports/1/verify \
  -H "Authorization: Bearer <admin-token>"

# Check updated trust score in profile
curl -X GET http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer <token>"
```

### 2. Test Anonymous Reporting

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": 1,
    "type": "harassment",
    "description": "Anonymous report test",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "is_anonymous": true
  }'
```

### 3. Test Live Trip Sharing

```bash
# Create trip
curl -X POST http://localhost:3000/api/live-trips \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Trip",
    "destination": "City Center",
    "trusted_contacts": [
      {"name": "Friend", "email": "friend@example.com"}
    ]
  }'

# View shared trip (public - no auth)
curl -X GET http://localhost:3000/api/live-trips/shared/<token>

# Update location
curl -X PUT http://localhost:3000/api/live-trips/1/location \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7580,
    "longitude": -73.9855
  }'

# Trigger emergency
curl -X POST http://localhost:3000/api/live-trips/1/emergency \
  -H "Authorization: Bearer <token>"
```

### 4. Test Admin Notifications

```bash
# Send notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Alert",
    "message": "This is a test notification",
    "send_to_all_users": true
  }'

# Get notifications list
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer <admin-token>"
```

---

## Environment Variables Required

Ensure these are set in your `.env` file:

```bash
# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SafeTrail <noreply@safetrail.com>
```

---

## Next Steps: Frontend Implementation

### 1. Trust Score Display
- Add trust score badge to user profile
- Show trust level indicator (Low/Medium/High/Very High)
- Display score history chart

### 2. Anonymous Reporting Toggle
- Add checkbox in report form: "Submit anonymously"
- Show warning about no reputation impact
- Hide user info when viewing anonymous reports

### 3. Live Trip Sharing UI
- Trip creation form with route planning
- Live map view with current location marker
- Emergency button (prominent red button)
- Share link generation and copying
- Public trip viewer page

### 4. Admin Notification Panel
- Notification composer with rich text editor
- Recipient selection interface
- Sent notifications history
- Delivery statistics dashboard

---

## Database Migrations Applied

✅ Migration 009: Weather and AQI data columns
✅ Migration 010: Trust score system
✅ Migration 011: Live trips table
✅ Migration 012: Admin notifications table

All migrations have been successfully applied to the database.

---

## API Routes Summary

### Reports (Enhanced)
- `POST /api/reports` - Create report (supports is_anonymous)
- `GET /api/reports` - List reports (includes trust scores)
- `PATCH /api/reports/:id/verify` - Verify report (updates trust score)
- `PATCH /api/reports/:id/reject` - Reject report (decreases trust score)

### Live Trips (New)
- `POST /api/live-trips` - Create new trip
- `GET /api/live-trips` - Get my active trips
- `GET /api/live-trips/shared/:token` - View shared trip (public)
- `PUT /api/live-trips/:id/location` - Update current location
- `POST /api/live-trips/:id/emergency` - Trigger emergency alert
- `PUT /api/live-trips/:id/end` - End active trip

### Admin Notifications (New)
- `POST /api/notifications/send` - Send notification (admin only)
- `GET /api/notifications` - List all notifications (admin only)
- `GET /api/notifications/:id` - Get notification details (admin only)

---

## Implementation Status

✅ **Backend Complete**
- Trust score calculation system
- Anonymous reporting support
- Live trip tracking and sharing
- Admin notification system with email

⏳ **Frontend Pending**
- UI components for all new features
- Integration with backend APIs
- Real-time updates for live trips
- Admin dashboard enhancements

---

**Last Updated**: January 2024
**Version**: 1.0.0
