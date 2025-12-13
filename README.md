# SafeTrail 

A comprehensive community-driven safety and travel planning platform that helps users identify safe locations, report incidents, and plan secure trips. SafeTrail combines real-time safety metrics with community intelligence to empower travelers with actionable safety information.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Development Guide](#development-guide)

---

## Overview

SafeTrail is a full-stack application designed to:
- **Visualize Safety Metrics**: Interactive maps showing safety scores for cities and places
- **Community Reporting**: Users can report incidents and hazards at specific locations
- **Safety Verification**: Admin dashboard to verify and manage reported incidents
- **Trip Planning**: Plan safe routes and trips with real-time safety information
- **Real-time Alerts**: WebSocket-based alerts for critical safety events
- **Emergency Services**: Quick access to emergency contacts and services
- **Attractions & Points of Interest**: Curated information about safe attractions

The platform serves both regular users seeking safety information and administrators managing safety data across multiple cities.

---

## Features

### 🆘 **Emergency Management System** ⭐ NEW
- **One-Click SOS Alert**: Emergency button with location sharing
- **Emergency Contacts**: Add/edit/delete trusted contacts with email notifications
- **Medical Profile**: Store blood type, allergies, medications, and conditions
- **Automatic Email Alerts**: SMTP-based emergency notifications with Google Maps links
- **Geolocation Integration**: Browser-based location tracking with retry and fallback
- **SOS History**: Track all emergency alerts and their timestamps
- **Dashboard Integration**: Quick access SOS button on main dashboard
- **Non-Blocking Design**: Alerts are created immediately, emails sent in background

### 🗺️ **Maps & Location Services**
- Interactive map view with safety score visualization
- City-level and place-level safety metrics
- Search and filter by location type and safety status
- Real-time location tracking for trip planning
- Weather and Air Quality Index (AQI) integration

### 📍 **Incident Reporting**
- Submit safety reports with detailed descriptions
- Photo uploads for incident documentation
- Severity classification (1-5 levels)
- Real-time status tracking (pending → verified → resolved)

### 👥 **User Management**
- Email-based registration and authentication
- OTP verification system
- Role-based access control (User/Admin)
- User profile management

### 🔐 **Admin Dashboard**
- Moderation panel for pending reports
- Verify or reject incident reports
- Safety score management
- Dashboard statistics and metrics
- Bulk action management

### 🚨 **Emergency Management System**
- **SOS Alert Button**: One-click emergency alert with live location sharing
- **Emergency Contacts**: Manage trusted contacts who receive SOS alerts via email
- **Medical Information**: Store critical medical data (blood type, allergies, medications)
- **Email Notifications**: Automatic SMTP email alerts to all emergency contacts with Google Maps link
- **Emergency Services Directory**: Quick access to local emergency numbers (police, ambulance, fire)
- **SOS History**: View all past emergency alerts and responses
- **Geolocation Integration**: Automatic location detection with retry logic and fallback

### ✈️ **Trip Planning**
- Create and manage trip plans
- Route safety analysis
- Multiple destination support
- Trip sharing capabilities

### 📱 **Attractions & Discovery**
- Curated attractions database
- Safety ratings for tourist destinations
- Category-based browsing
- User reviews and ratings

### ⚡ **Real-time Features**
- WebSocket-based alert system
- Live report notifications
- Score update broadcasts
- Real-time safety metric updates

---

## Tech Stack

### **Backend**
- **Framework**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL 16
- **Cache**: Redis (performance optimization)
- **Authentication**: JWT (JSON Web Tokens)
- **File Uploads**: Multer
- **Real-time**: WebSocket (ws library)
- **Email**: Nodemailer (OTP verification)
- **Password Hashing**: bcryptjs
- **Validation**: Zod

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Maps**: Leaflet
- **HTTP Client**: TanStack React Query
- **Router**: React Router v6
- **Drag & Drop**: @dnd-kit
- **Charts**: Recharts
- **Form Handling**: React Hook Form
- **Toast Notifications**: Sonner

### **DevOps & Tools**
- **Containerization**: Docker & Docker Compose
- **Task Runner**: Bun
- **Linting**: ESLint
- **Code Formatting**: Prettier

---

## Project Structure

```
SafeTrail/
├── backend/                          # Express.js API Server
│   ├── src/
│   │   ├── index.ts                  # Application entry point & server setup
│   │   ├── db/
│   │   │   ├── connection.ts         # PostgreSQL connection pool
│   │   │   ├── migrations.ts         # Database schema migrations
│   │   │   ├── migrate.ts            # Migration runner
│   │   │   ├── seed.ts               # Initial data seeding
│   │   │   ├── seedAttractions.ts    # Attractions data seed
│   │   │   ├── seedEmergencyData.ts  # Emergency services seed
│   │   │   ├── createTripPlansTable.ts
│   │   │   ├── createEmergencyTables.ts
│   │   │   ├── fixMigrations.ts      # Manual migrations for schema fixes
│   │   │   ├── updateEmergencyContacts.ts # Emergency contacts migration
│   │   │   ├── updateSafetyScores.ts # Safety score calculations
│   │   │   ├── updateCounts.ts       # Report count updates
│   │   │   └── migrations/
│   │   │       └── 007_create_attractions_table.ts
│   │   ├── routes/
│   │   │   ├── auth.ts               # Authentication endpoints
│   │   │   ├── users.ts              # User profile management
│   │   │   ├── places.ts             # Place/location endpoints
│   │   │   ├── cities.ts             # City endpoints with stats
│   │   │   ├── reports.ts            # Incident reporting endpoints
│   │   │   ├── alerts.ts             # Alert endpoints
│   │   │   ├── attractions.ts        # Tourist attractions endpoints
│   │   │   ├── emergency.ts          # Emergency services endpoints
│   │   │   ├── tripPlans.ts          # Trip planning endpoints
│   │   │   └── admin.ts              # Admin dashboard endpoints
│   │   ├── lib/
│   │   │   ├── jwt.ts                # JWT token generation & verification
│   │   │   ├── email.ts              # Email sending, OTP verification & emergency alerts
│   │   │   ├── redis.ts              # Redis client & cache utilities
│   │   │   ├── safetyScore.ts        # Safety score algorithms
│   │   │   ├── trustScore.ts         # User trust score calculations
│   │   │   └── weather.ts            # Weather & AQI integration
│   │   ├── middleware/
│   │   │   └── auth.ts               # Authentication & authorization middleware
│   │   └── utils/
│   ├── uploads/                      # User-uploaded files (photos)
│   ├── package.json                  # Backend dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── Dockerfile                    # Container configuration
│   └── README.md                     # Backend-specific documentation
│
├── frontend/                         # React + Vite Web Application
│   ├── src/
│   │   ├── main.tsx                  # React app entry point
│   │   ├── App.tsx                   # Main app component with routing
│   │   ├── index.css                 # Global styles
│   │   ├── pages/
│   │   │   ├── Index.tsx             # Landing page
│   │   │   ├── MapView.tsx           # Interactive safety map
│   │   │   ├── Dashboard.tsx         # User dashboard
│   │   │   ├── ReportForm.tsx        # Incident report submission
│   │   │   ├── AdminDashboard.tsx    # Admin moderation panel
│   │   │   ├── AdminLogin.tsx        # Admin login page
│   │   │   ├── UserLogin.tsx         # User login page
│   │   │   ├── UserSignup.tsx        # User registration page
│   │   │   ├── VerifyEmail.tsx       # Email verification page
│   │   │   ├── TripPlanNew.tsx       # Trip planning interface
│   │   │   ├── Emergency.tsx         # Emergency services listing
│   │   │   ├── EmergencyDetail.tsx   # Emergency service details
│   │   │   ├── Profile.tsx           # User profile page
│   │   │   └── NotFound.tsx          # 404 page
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx   # Shared dashboard layout
│   │   │   ├── NavLink.tsx           # Navigation component
│   │   │   ├── EmergencyContacts.tsx # Emergency contacts management
│   │   │   ├── MedicalInfo.tsx       # Medical information form
│   │   │   ├── SOSButton.tsx         # Emergency SOS alert button
│   │   │   ├── landing/              # Landing page components
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── FeatureBoxes.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── MapPreview.tsx
│   │   │   │   └── Footer.tsx
│   │   │   └── ui/                   # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── table.tsx
│   │   │       ├── badge.tsx
│   │   │       └── [other UI components...]
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx        # Mobile detection hook
│   │   │   └── use-toast.ts          # Toast notification hook
│   │   ├── lib/
│   │   │   ├── api.ts                # API client functions
│   │   │   └── utils.ts              # Utility functions
│   │   └── data/
│   │       └── mockData.ts           # Constants and mock data
│   ├── public/
│   │   └── robots.txt                # SEO robots file
│   ├── package.json                  # Frontend dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.ts            # Tailwind CSS configuration
│   ├── vite.config.ts                # Vite build configuration
│   ├── Dockerfile                    # Production container
│   ├── Dockerfile.dev                # Development container
│   └── README.md                     # Frontend-specific documentation
│
├── docker-compose.yml                # Multi-container orchestration
├── data.json                         # Initial/sample data
└── README.md                         # This file

```

### Key Database Tables

```
📊 Users
  ├─ id, email, password_hash, full_name
  ├─ role (user/admin), email_verified
  └─ timestamps (created_at, updated_at)

🌍 Countries
  ├─ id, name, code, timezone
  └─ Relationships: [1-∞] Cities

🏙️ Cities
  ├─ id, country_id, name, latitude, longitude
  ├─ safety_score, places_count, reports_count
  └─ Relationships: [1-∞] Places

📍 Places
  ├─ id, city_id, name, latitude, longitude
  ├─ type, safety_score, report_count
  └─ Relationships: [1-∞] Reports

📋 Reports
  ├─ id, user_id, place_id, type, description
  ├─ status, severity, coordinates
  ├─ verified_at, verified_by
  └─ Relationships: [1-∞] ReportPhotos

📸 ReportPhotos
  ├─ id, report_id, photo_url, uploaded_at
  └─ Relationships: [∞-1] Reports

🚨 Alerts
  ├─ id, type, location, description
  ├─ severity, created_at
  └─ Relationships: [∞-1] Cities

🎫 TripPlans
  ├─ id, user_id, name, destinations, dates
  ├─ status, created_at
  └─ Relationships: [∞-1] Users

🏨 Attractions
  ├─ id, city_id, name, category, latitude, longitude
  ├─ rating, description
  └─ Relaplace_id, police_number, ambulance_number
  ├─ fire_number, women_helpline, tourist_helpline
  ├─ nearest_police_name, nearest_police_distance_m
  └─ Relationships: [∞-1] Places

👨‍👩‍👧 EmergencyContacts
  ├─ id, user_id, name, email, relationship
  ├─ is_primary, created_at, updated_at
  └─ Relationships: [∞-1] Users

🆘 SOSAlerts
  ├─ id, user_id, location (JSON), message
  ├─ created_at, resolved_at
  └─ Relationships: [∞-1] Users

🔐 EmailVerificationOTP
  ├─ id, user_id, otp, expires_at
  └─ Relationships: [∞-1] Users

💊 Medical Info (stored in users.medical_info JSONB)
  ├─ blood_type, allergies, medications
  ├─ medical_conditions, emergency_notes
  └─ Part of Users table
🔐 EmailVerificationOTP
  ├─ id, user_id, otp, expires_at
  └─ Relationships: [∞-1] Users
```

---

## Installation & Setup

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** 14+
- **Redis** 7+
- **Docker** & **Docker Compose** (optional, for containerized setup)
- **Bun** (optional, for faster package management)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd SafeTrail
```

### Step 2: Environment Setup

#### Backend (.env)
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=safetrail
DB_USER=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT & Auth
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Email (Gmail SMTP) - Required for OTP and Emergency Alerts
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password  # Use Gmail App Password
SMTP_FROM=SafeTrail <your-email@gmail.com>

# Server
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# URLs
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```bash
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Step 3: Install Dependencies

**Backend:**
```bash
cd backend
npm install
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

---

## Running the Application

### Option 1: Docker Compose (Recommended)
```bash
docker-compose up --build
```
This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000
- Frontend on port 5173

### Option 2: Local Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

**Terminal 3 - Database Setup (first time only):**
```bash
cd backend
npm run db:migrate    # Run migrations
npm run db:seed       # Seed initial data
```

### Verify Setup
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health

---

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication Endpoints

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "full_name": "John Doe"
}

Response: { user: {...}, message: "..." }
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}

Response: { user: {...}, token: "jwt_token" }
```

#### Admin Login
```
POST /auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin_password"
}

Response: { user: {...}, token: "jwt_token" }
```

#### Verify OTP
```
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}

Response: { success: true, message: "..." }
```

### Places & Cities Endpoints

#### Get All Places
```
GET /places?city_id=1&type=restaurant

Response: [{ id, name, city_id, safety_score, ... }]
```

#### Get Place Details
```
GET /places/:id

Response: {
  id, name, city_id, latitude, longitude, type,
  safety_score, report_count,
  recentReports: [...]
}
```

#### Get All Cities
```
GET /cities?country_id=1

Response: [{ id, name, safety_score, places_count, ... }]
```

#### Get City Details
```
GET /cities/:id

Response: {
  id, name, country_id, latitude, longitude,
  safety_score, places_count, reports_count,
  places: [...], recentReports: [...]
}
```

### Reporting Endpoints

#### Create Report
```
POST /reports
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data

{
  place_id: 1,
  type: "theft",
  description: "Pickpocketing incident at main station",
  latitude: 40.7128,
  longitude: -74.0060,
  severity: 3,
  photo: <file>
}

Response: { id, status: "pending", created_at, ... }
```

#### Get All Reports (Admin Only)
```
GET /reports?status=pending&limit=20&offset=0
Authorization: Bearer <admin_jwt_token>

Response: { reports: [...], total: 100 }
```

#### Get Report Details
```
GET /reports/:id
Authorization: Bearer <jwt_token>

Response: { id, place_id, type, description, photos: [...], ... }
```

#### Verify Report (Admin)
```
PATCH /reports/:id/verify
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

Response: { status: "verified", verified_at: "..." }
```

#### Reject Report (Admin)
```
PATCH /reports/:id/reject
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

Response: { status: "rejected", rejected_at: "..." }
```

### Alerts Endpoints

#### Get Recent Alerts
```
GET /alerts?city_id=1&limit=10

Response: [{ id, type, severity, created_at, ... }]
```

#### Create Alert (Admin)
```
POST /alerts
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json

{
  type: "severe_weather",
  city_id: 1,
  description: "Heavy rainfall warning",
  severity: 4
}

Response: { id, type, created_at, ... }
```

### Attractions Endpoints
Contacts
```
GET /emergency/contacts
Authorization: Bearer <jwt_token>

Response: [{ id, name, email, relationship, is_primary, ... }]
```

#### Add Emergency Contact
```
POST /emergency/contacts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "relationship": "Brother",
  "is_primary": true
}

Response: { id, name, email, ... }
```

#### Update Emergency Contact
```
PUT /emergency/contacts/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Doe Updated",
  "email": "john.new@example.com"
}

Response: { id, name, email, ... }
```

#### Delete Emergency Contact
```
DELETE /emergency/contacts/:id
Authorization: Bearer <jwt_token>

Response: { success: true }
```

#### Get Medical Information
```
GET /emergency/medical-info
Authorization: Bearer <jwt_token>

Response: {
  blood_type: "O+",
  allergies: ["Penicillin"],
  medications: ["Aspirin"],
  medical_conditions: ["Asthma"],
  emergency_notes: "..."
}
```

#### Update Medical Information
```
PUT /emergency/medical-info
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "blood_type": "O+",
  "allergies": ["Penicillin", "Peanuts"],
  "medications": ["Aspirin"],
  "medical_conditions": ["Asthma"],
  "emergency_notes": "Inhaler in bag"
}

Response: { success: true, medical_info: {...} }
```

#### Trigger SOS Alert
```
POST /emergency/sos
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 10
  },
  "message": "Emergency! I need immediate help!"
}

Response: {
  success: true,
  alert: { id, user_id, location, message, created_at },
  contactsNotified: 3
}

Note: Automatically sends emails to all emergency contacts with:
- User's name and email
- Emergency message
- Google Maps link to exact location
- Timestamp of alert
```

#### Get SOS Alert History
```
GET /emergency/sos/history
Authorization: Bearer <jwt_token>

Response: [
  {
    id, location, message, created_at, resolved_at,
    contacts_notified: 3
  }
]
```

#### Get Emergency Services
```
GET /emergency/services?city_id=1

Response: [{ 
  place_id, place_name, city_name,
  police_number, ambulance_number, fire_number,
  women_helpline, tourist_helpline,
  nearest_police_name, nearest_police_distance_m,
  ... 

Response: [{ id, name, city_id, latitude, longitude, category, rating, ... }]
```

#### Get Attraction Details
```
GET /attractions/:id

Response: { id, name, description, category, rating, reviews: [...], ... }
```

### Emergency Endpoints

#### Get Emergency Services
```
GET /emergency/services?city_id=1&type=hospital

Response: [{ id, name, type, phone, address, coordinates, ... }]
```

### Trip Planning Endpoints

#### Create Trip Plan
```
POST /tripPlans
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  name: "Summer Vacation",
  destinations: [1, 2, 3],
  start_date: "2024-06-01",
  end_date: "2024-06-10"
}

Response: { id, name, status: "draft", created_at, ... }
```

#### Get User's Trip Plans
```
GET /tripPlans
Authorization: Bearer <jwt_token>

Response: [{ id, name, destinations: [...], status, ... }]
```

### Admin Dashboard Endpoints

#### Dashboard Stats
```
GET /admin/dashboard
Authorization: Bearer <admin_jwt_token>

Response: {
  totalReports: 150,
  pendingReporor Emergency Alerts Not Sending
- Verify SMTP credentials in `.env`
- **Use Gmail App-Specific Password** (recommended):
  1. Enable 2-Step Verification in Google Account
  2. Go to Security → App passwords
  3. Generate password for "Mail"
  4. Use generated password in `SMTP_PASS`
- Check spam folder for test emails
- Verify email format is correct
  usersCount: 1200,
  recentReports: [...]
}
```

#### Pending Reports for Moderation
```
GET /admin/reports/pending?limit=20
Authorization: Bearer <admin_jwt_token>

Response: { reports: [...], total: 12 }
```

### WebSocket Events

Connect to: `ws://localhost:3000`

#### Subscribe to Alerts
```javascript
ws.send(JSON.stringify({
  type: 'subscribe',
  channel: 'alerts',
  city_id: 1
}));

// Receive events
// { type: 'alert:new', data: { ... } }
```

#### Listen for Report Updates
```javascript
// Automatically broadcast
// { type: 'report:submitted', data: { ... } }
// { type: 'report:verified', data: { ... } }
```

---

## Development Guide

### Code Style
- **Language**: TypeScript for type safety
- **Formatting**: Prettier (2-space indentation)
- **Linting**: ESLint with TypeScript support

### Formatting Code
```bash
# Backend
cd backend
npm run format

# Frontend
cd frontend
npm run format
```

### Linting
```bash
# Backend
cd backend
npm run lint

# Frontend
cd frontend
npm run lint
```

### Running Tests (if available)
```bash
npm test
```

### Database Migrations
```bash
# Create migration
npm run db:migrate

# Seed data
npm run db:seed

# Seed attractions
npm run db:seed:attractions
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create pull request
git push origin feature/feature-name
```

---

## Common Issues & Troubleshooting

### Database Connection Failed
- Ensure PostgreSQL is running: `psql -U postgres -h localhost`
- Check credentials in `.env`
- Verify database exists: `psql -U postgres -l`

### Redis Connection Failed
- Ensure Redis is running: `redis-cli ping`
- Check Redis port (default 6379)

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Kill process on port 3000 (Mac/Linux)
lsof -ti:3000 | xargs kill -9
```

### Email OTP Not Sending
- Verify SMTP credentials in `.env`
- Enable "Less secure app access" for Gmail
- Use app-specific password (recommended)

### TypeScript Errors
```bash
# Rebuild types
npm run build
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
---

## Recent Updates (December 2025)

### Emergency Management System
- ✅ Complete emergency contact management system
- ✅ Medical information storage with JSONB
- ✅ SOS alert button with real-time geolocation
- ✅ Email notifications via Nodemailer (SMTP)
- ✅ Emergency contacts table with email-only approach
- ✅ Non-blocking email sending for reliability
- ✅ Geolocation retry logic with fallback
- ✅ Dashboard SOS button integration
- ✅ Emergency page with tabs (Contacts, Medical Info, Services, History)

### Weather & Environmental Data
- ✅ OpenWeatherMap API integration
- ✅ Air Quality Index (AQI) monitoring
- ✅ Real-time weather updates for cities
- ✅ Automatic data refresh

---

5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues, questions, or suggestions, please create an issue on GitHub or contact the development team.

---

**Last Updated**: December 13, 2025


