import { query } from './connection.js';

export async function manualMigration() {
  try {
    console.log('🔄 Running manual migration...');

    // Check if countries table exists
    const countriesTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'countries'
      );
    `);

    if (!countriesTableCheck.rows[0].exists) {
      console.log('Creating countries table...');
      await query(`
        CREATE TABLE countries (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          code VARCHAR(2) UNIQUE NOT NULL,
          timezone VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX idx_countries_code ON countries(code);
      `);
      console.log('✅ Created countries table');
    } else {
      console.log('✅ countries table already exists');
    }

    // Check if country_id column exists in cities
    const countryIdCheck = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'cities' AND column_name = 'country_id'
    `);

    if (countryIdCheck.rows.length === 0) {
      console.log('Adding country_id column to cities table...');
      await query(`
        ALTER TABLE cities 
        ADD COLUMN country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE
      `);
      await query(`
        CREATE INDEX idx_cities_country_id ON cities(country_id)
      `);
      console.log('✅ Added country_id column to cities');
    } else {
      console.log('✅ country_id column already exists in cities');
    }

    // Check if email_verified column exists
    const columnCheck = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);

    if (columnCheck.rows.length === 0) {
      console.log('Adding email_verified column to users table...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN email_verified BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ Added email_verified column');
    } else {
      console.log('✅ email_verified column already exists');
    }

    // Check if email_verified_at column exists
    const emailVerifiedAtCheck = await query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified_at'
    `);

    if (emailVerifiedAtCheck.rows.length === 0) {
      console.log('Adding email_verified_at column to users table...');
      await query(`
        ALTER TABLE users 
        ADD COLUMN email_verified_at TIMESTAMP
      `);
      console.log('✅ Added email_verified_at column');
    } else {
      console.log('✅ email_verified_at column already exists');
    }

    // Check if email_verification_otp table exists
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_verification_otp'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.log('Creating email_verification_otp table...');
      await query(`
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
      `);
      console.log('✅ Created email_verification_otp table');
    } else {
      console.log('✅ email_verification_otp table already exists');
    }

    console.log('✅ Manual migration completed successfully');
  } catch (error) {
    console.error('❌ Manual migration failed:', error);
    throw error;
  }
}
