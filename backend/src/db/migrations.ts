import { query } from './connection.js';

const migrations = [
  {
    name: '001_create_users_table',
    up: `
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        email_verified BOOLEAN DEFAULT FALSE,
        email_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_users_email ON users(email);
    `,
    down: `DROP TABLE IF EXISTS users;`
  },
  {
    name: '002_create_cities_table',
    up: `
      CREATE TABLE cities (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        safety_score DECIMAL(3, 1) DEFAULT 50,
        places_count INTEGER DEFAULT 0,
        reports_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_cities_name ON cities(name);
    `,
    down: `DROP TABLE IF EXISTS cities;`
  },
  {
    name: '003_create_places_table',
    up: `
      CREATE TABLE places (
        id SERIAL PRIMARY KEY,
        city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        type VARCHAR(100),
        safety_score DECIMAL(3, 1) DEFAULT 50,
        report_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_places_city_id ON places(city_id);
      CREATE INDEX idx_places_name ON places(name);
    `,
    down: `DROP TABLE IF EXISTS places;`
  },
  {
    name: '004_create_reports_table',
    up: `
      CREATE TABLE reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        severity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verified_at TIMESTAMP,
        verified_by INTEGER REFERENCES users(id)
      );
      CREATE INDEX idx_reports_place_id ON reports(place_id);
      CREATE INDEX idx_reports_user_id ON reports(user_id);
      CREATE INDEX idx_reports_status ON reports(status);
      CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
    `,
    down: `DROP TABLE IF EXISTS reports;`
  },
  {
    name: '005_create_report_photos_table',
    up: `
      CREATE TABLE report_photos (
        id SERIAL PRIMARY KEY,
        report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        file_path VARCHAR(500) NOT NULL,
        file_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_report_photos_report_id ON report_photos(report_id);
    `,
    down: `DROP TABLE IF EXISTS report_photos;`
  },
  {
    name: '006_create_alerts_table',
    up: `
      CREATE TABLE alerts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        severity INTEGER DEFAULT 1,
        location_type VARCHAR(50),
        location_id INTEGER,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);
      CREATE INDEX idx_alerts_severity ON alerts(severity);
    `,
    down: `DROP TABLE IF EXISTS alerts;`
  },
  {
    name: '007_create_email_verification_otp_table',
    up: `
      CREATE TABLE email_verification_otp (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        otp VARCHAR(6) NOT NULL,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_verification_otp_user_id ON email_verification_otp(user_id);
    `,
    down: `DROP TABLE IF EXISTS email_verification_otp;`
  },
  {
    name: '008_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `,
    down: `DROP TABLE IF EXISTS migrations;`
  }
];

export async function runMigrations() {
  try {
    // Create migrations table if not exists
    await query(migrations[7].up);

    // Run each migration (excluding migrations table)
    for (const migration of migrations.slice(0, 7)) {
      const result = await query(
        'SELECT * FROM migrations WHERE name = $1',
        [migration.name]
      );

      if (result.rows.length === 0) {
        console.log(`Running migration: ${migration.name}`);
        await query(migration.up);
        await query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      } else {
        console.log(`Migration already run: ${migration.name}`);
      }
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  }
}

export async function rollbackMigrations() {
  try {
    for (let i = migrations.length - 2; i >= 0; i--) {
      const migration = migrations[i];
      console.log(`Rolling back migration: ${migration.name}`);
      await query(migration.down);
      await query('DELETE FROM migrations WHERE name = $1', [migration.name]);
    }
    console.log('✅ All migrations rolled back successfully');
  } catch (error) {
    console.error('❌ Rollback error:', error);
    throw error;
  }
}
