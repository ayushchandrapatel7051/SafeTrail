# SafeTrail Backend API

Node.js + Express backend for SafeTrail application with PostgreSQL database.

## Features

- ✅ RESTful API with Express.js
- ✅ PostgreSQL database with migrations
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Real-time alerts via WebSocket
- ✅ Redis caching for performance
- ✅ File upload support for complaint photos
- ✅ Safety score calculation and aggregation
- ✅ Background job queue ready

## Installation

```bash
npm install
```

## Setup

1. Create PostgreSQL database:
```sql
CREATE DATABASE safetrail;
```

2. Configure `.env` file:
```bash
cp .env.example .env
```

3. Run migrations:
```bash
npm run db:migrate
```

4. Seed initial data (optional):
```bash
npm run db:seed
```

## Development

```bash
npm run dev
```

Server will run on `http://localhost:3000`

## Database

### Tables

- **users** - User accounts with roles
- **cities** - Cities with safety metrics
- **places** - Places/locations with safety scores
- **reports** - User complaints and incident reports
- **alerts** - Real-time safety alerts
- **report_photos** - Photos attached to reports

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh JWT token

### Places & Cities
- `GET /api/places` - List all places
- `GET /api/places/:id` - Get place details
- `GET /api/cities` - List all cities
- `GET /api/cities/:id` - Get city with stats

### Reports
- `GET /api/reports` - List reports (admin only)
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report details
- `PATCH /api/reports/:id` - Update report (admin only)
- `PATCH /api/reports/:id/verify` - Verify report
- `PATCH /api/reports/:id/reject` - Reject report

### Alerts
- `GET /api/alerts` - Get recent alerts
- `POST /api/alerts` - Create alert (admin only)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/reports/pending` - Pending moderation

## WebSocket Events

- `alert:new` - New safety alert
- `report:submitted` - New report submitted
- `report:verified` - Report verification result
- `score:updated` - Safety score updated

## Environment Variables

See `.env.example` for all available options.

## Building

```bash
npm run build
npm start
```

## License

MIT
