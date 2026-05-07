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
  "password": "SecurePasswo
... (truncated, 24678 total chars)

## Additional Details
This section has been updated with more information as requested by the user.