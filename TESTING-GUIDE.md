# Quick Testing Guide for New Features

## Prerequisites
- Backend running on `http://localhost:3000`
- Valid user token (get from login)
- Valid admin token (login as admin)

---

## 1. Trust Score System

### Check Current Trust Score
```bash
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

Look for:
```json
{
  "trust_score": 50,
  "verified_reports_count": 0
}
```

### Submit a Report (Builds Trust)
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": 1,
    "type": "incident",
    "description": "Test incident for trust score",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "severity": 2
  }'
```

### Admin Verifies Report (Increases Trust)
```bash
curl -X PATCH http://localhost:3000/api/reports/REPORT_ID/verify \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Check Updated Trust Score
```bash
# Trust score should now be 55 (50 + 5 for verified report)
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

## 2. Anonymous Reporting

### Submit Anonymous Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": 1,
    "type": "harassment",
    "description": "Sensitive incident reported anonymously",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "severity": 3,
    "is_anonymous": true
  }'
```

### View Report (User Info Hidden)
```bash
curl http://localhost:3000/api/reports/REPORT_ID

# Response shows:
{
  "is_anonymous": true,
  "user_id": null,
  "reporter_name": null,
  "reporter_email": null,
  "reporter_trust_score": 50  # default score
}
```

**Note**: Anonymous reports don't affect your trust score when verified/rejected.

---

## 3. Live Trip Sharing

### Create a New Trip
```bash
curl -X POST http://localhost:3000/api/live-trips \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Evening Walk",
    "destination": "Central Park",
    "route": {
      "waypoints": [
        {"lat": 40.7128, "lng": -74.0060, "name": "Home"},
        {"lat": 40.7580, "lng": -73.9855, "name": "Park"}
      ]
    },
    "trusted_contacts": [
      {
        "name": "Emergency Contact",
        "email": "friend@example.com",
        "phone": "+1234567890"
      }
    ]
  }'
```

Response includes:
```json
{
  "id": 1,
  "share_token": "abc123-xyz789",
  "share_link": "Share this link: http://localhost:3000/live/abc123-xyz789"
}
```

### View Shared Trip (No Auth Required)
```bash
curl http://localhost:3000/api/live-trips/shared/abc123-xyz789

# Public access - anyone with link can view
```

### Update Current Location
```bash
curl -X PUT http://localhost:3000/api/live-trips/1/location \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 40.7500,
    "longitude": -73.9900,
    "timestamp": "2024-01-15T14:30:00Z"
  }'
```

### Trigger Emergency
```bash
curl -X POST http://localhost:3000/api/live-trips/1/emergency \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Need help! Unsafe situation"
  }'
```

This will:
- Set `emergency_triggered = true`
- Email all trusted contacts immediately
- Broadcast WebSocket alert

### End Trip
```bash
curl -X PUT http://localhost:3000/api/live-trips/1/end \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

### Get My Active Trips
```bash
curl http://localhost:3000/api/live-trips \
  -H "Authorization: Bearer YOUR_USER_TOKEN"
```

---

## 4. Admin Notifications

### Send Notification to All Users
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weather Alert",
    "incident_type": "weather",
    "message": "Heavy rain expected in the next 2 hours. Please take necessary precautions and avoid outdoor activities.",
    "send_to_all_users": true
  }'
```

### Send Notification to Specific City Users
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Safety Advisory - Downtown Area",
    "incident_type": "safety",
    "message": "Increased police presence in downtown area due to ongoing event.",
    "send_to_city_users": 1
  }'
```

### Send to Specific Email Addresses
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notification",
    "incident_type": "test",
    "message": "This is a test notification.",
    "recipient_emails": ["user1@example.com", "user2@example.com"]
  }'
```

### Get All Sent Notifications
```bash
curl http://localhost:3000/api/notifications?limit=10&offset=0 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Get Specific Notification Details
```bash
curl http://localhost:3000/api/notifications/1 \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Complete User Journey Example

### Scenario: User submits reports and builds trust

```bash
# 1. User logs in
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}')

USER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

# 2. Check initial trust score (should be 50)
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer $USER_TOKEN"

# 3. Submit first report
REPORT1=$(curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "place_id": 1,
    "type": "theft",
    "description": "Witnessed a theft incident",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "severity": 3
  }')

REPORT1_ID=$(echo $REPORT1 | jq -r '.id')

# 4. Admin verifies report
curl -X PATCH http://localhost:3000/api/reports/$REPORT1_ID/verify \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 5. Check updated trust score (should be 55 now)
curl http://localhost:3000/api/profile/me \
  -H "Authorization: Bearer $USER_TOKEN"

# 6. Submit report with photo (+2 trust when verified)
curl -X POST http://localhost:3000/api/reports \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "place_id=1" \
  -F "type=incident" \
  -F "description=Incident with photo evidence" \
  -F "latitude=40.7128" \
  -F "longitude=-74.0060" \
  -F "severity=2" \
  -F "photo=@/path/to/image.jpg"

# 7. Create live trip before going out
curl -X POST http://localhost:3000/api/live-trips \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Night Walk",
    "destination": "Restaurant",
    "trusted_contacts": [{"name": "Friend", "email": "friend@example.com"}]
  }'
```

---

## Expected Trust Score Progression

| Action | Trust Score Change | New Total |
|--------|-------------------|-----------|
| Start | - | 50 |
| 1st verified report | +5 | 55 |
| 2nd verified report | +5 | 60 |
| Report with photo (verified) | +7 (+5 verify, +2 photo) | 67 |
| 1st rejected report | -3 | 64 |
| 5+ verified reports (accuracy bonus) | +10 | 74+ |

---

## Testing Email Notifications

**Important**: Email notifications require valid SMTP credentials in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=SafeTrail <noreply@safetrail.com>
```

Test email sending:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Email Test",
    "message": "Testing email delivery",
    "recipient_emails": ["your-test-email@gmail.com"]
  }'
```

---

## Troubleshooting

### Trust Score Not Updating
1. Check report status: `curl http://localhost:3000/api/reports/REPORT_ID`
2. Ensure report is verified or rejected
3. Check user's verified_reports_count increased
4. Look for errors in backend logs

### Anonymous Report Shows User Info
- Verify `is_anonymous: true` in request body
- Check report response: `user_id` should be `null`

### Live Trip Not Updating
- Ensure trip status is 'active'
- Verify you're the trip owner
- Check WebSocket connection for real-time updates

### Emails Not Sending
- Verify SMTP credentials in `.env`
- Check backend logs for email errors
- Test with Gmail app password (not regular password)
- Enable "Less secure app access" or use App Password

---

## Database Queries for Verification

```sql
-- Check user trust scores
SELECT id, email, trust_score, verified_reports_count 
FROM users 
ORDER BY trust_score DESC;

-- Check anonymous reports
SELECT id, type, description, is_anonymous, reporter_trust_score 
FROM reports 
WHERE is_anonymous = true;

-- Check active live trips
SELECT id, name, destination, status, emergency_triggered 
FROM live_trips 
WHERE status = 'active';

-- Check sent notifications
SELECT id, title, status, sent_at, 
       ARRAY_LENGTH(recipient_emails, 1) as recipients_count
FROM admin_notifications 
ORDER BY created_at DESC;
```

---

## Next Steps

1. **Build Frontend Components**
   - Trust score badge in profile
   - Anonymous reporting checkbox
   - Live trip map interface
   - Admin notification composer

2. **Test Edge Cases**
   - Multiple rapid location updates
   - Emergency triggers during network issues
   - Bulk notification sending

3. **Monitor Performance**
   - Trust score calculation speed
   - Email delivery rates
   - WebSocket connection stability

---

Last Updated: January 2024
