import { query } from './connection.js';

async function fixMigrations() {
  try {
    console.log('🔧 Fixing migration columns...');

    // Check and add trust_score to users
    const userTrustScore = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'trust_score'
    `);

    if (userTrustScore.rows.length === 0) {
      console.log('Adding trust_score to users table...');
      await query('ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 50');
      console.log('✅ Added trust_score to users');
    } else {
      console.log('✅ trust_score already exists in users');
    }

    // Check and add verified_reports_count to users
    const verifiedCount = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verified_reports_count'
    `);

    if (verifiedCount.rows.length === 0) {
      console.log('Adding verified_reports_count to users table...');
      await query('ALTER TABLE users ADD COLUMN verified_reports_count INTEGER DEFAULT 0');
      console.log('✅ Added verified_reports_count to users');
    } else {
      console.log('✅ verified_reports_count already exists in users');
    }

    // Check and add is_anonymous to reports
    const isAnonymous = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'reports' AND column_name = 'is_anonymous'
    `);

    if (isAnonymous.rows.length === 0) {
      console.log('Adding is_anonymous to reports table...');
      await query('ALTER TABLE reports ADD COLUMN is_anonymous BOOLEAN DEFAULT false');
      console.log('✅ Added is_anonymous to reports');
    } else {
      console.log('✅ is_anonymous already exists in reports');
    }

    // Check and add reporter_trust_score to reports
    const reporterTrustScore = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'reports' AND column_name = 'reporter_trust_score'
    `);

    if (reporterTrustScore.rows.length === 0) {
      console.log('Adding reporter_trust_score to reports table...');
      await query('ALTER TABLE reports ADD COLUMN reporter_trust_score INTEGER DEFAULT 50');
      console.log('✅ Added reporter_trust_score to reports');
    } else {
      console.log('✅ reporter_trust_score already exists in reports');
    }

    // Check if live_trips table exists
    const liveTripsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'live_trips'
      );
    `);

    if (!liveTripsTable.rows[0].exists) {
      console.log('Creating live_trips table...');
      await query(`
        CREATE TABLE live_trips (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
      `);
      console.log('✅ Created live_trips table');
    } else {
      console.log('✅ live_trips table already exists');
    }

    // Check if admin_notifications table exists
    const notificationsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'admin_notifications'
      );
    `);

    if (!notificationsTable.rows[0].exists) {
      console.log('Creating admin_notifications table...');
      await query(`
        CREATE TABLE admin_notifications (
          id SERIAL PRIMARY KEY,
          created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          incident_type VARCHAR(100),
          recipient_emails TEXT[],
          send_to_all_users BOOLEAN DEFAULT false,
          send_to_city_users INTEGER REFERENCES cities(id) ON DELETE SET NULL,
          status VARCHAR(50) DEFAULT 'draft',
          sent_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created admin_notifications table');
    } else {
      console.log('✅ admin_notifications table already exists');
    }

    // Check if emergency_contacts table exists
    const emergencyContactsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'emergency_contacts'
      );
    `);

    if (!emergencyContactsTable.rows[0].exists) {
      console.log('Creating emergency_contacts table...');
      await query(`
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
      `);
      console.log('✅ Created emergency_contacts table');
    } else {
      console.log('✅ emergency_contacts table already exists');
    }

    // Check if medical_info exists in users table
    const medicalInfo = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'medical_info'
    `);

    if (medicalInfo.rows.length === 0) {
      console.log('Adding medical_info to users table...');
      await query('ALTER TABLE users ADD COLUMN medical_info JSONB');
      console.log('✅ Added medical_info to users');
    } else {
      console.log('✅ medical_info already exists in users');
    }

    // Check if sos_alerts table exists
    const sosAlertsTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'sos_alerts'
      );
    `);

    if (!sosAlertsTable.rows[0].exists) {
      console.log('Creating sos_alerts table...');
      await query(`
        CREATE TABLE sos_alerts (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          location JSONB NOT NULL,
          message TEXT,
          status VARCHAR(50) DEFAULT 'active',
          resolved_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created sos_alerts table');
    } else {
      console.log('✅ sos_alerts table already exists');
    }

    console.log('\n✅ All migration fixes applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing migrations:', error);
    process.exit(1);
  }
}

fixMigrations();
