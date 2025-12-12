import pool from './connection';

async function createEmergencyServicesTable() {
  const client = await pool.connect();

  try {
    console.log('🏥 Creating emergency_services table...\n');

    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS emergency_services (
        id SERIAL PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        police_number VARCHAR(20),
        ambulance_number VARCHAR(20),
        fire_number VARCHAR(20),
        women_helpline VARCHAR(20),
        tourist_helpline VARCHAR(20),
        nearest_police_name VARCHAR(255),
        nearest_police_distance_m NUMERIC(10,2),
        nearest_police_lat NUMERIC(10,8),
        nearest_police_lon NUMERIC(11,8),
        nearest_police_osm_type VARCHAR(50),
        nearest_police_osm_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created emergency_services table');

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_emergency_services_place_id 
      ON emergency_services(place_id)
    `);

    console.log('✅ Created indexes');

    // Create hospitals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospitals (
        id SERIAL PRIMARY KEY,
        place_id INTEGER NOT NULL REFERENCES places(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        distance_m NUMERIC(10,2),
        latitude NUMERIC(10,8) NOT NULL,
        longitude NUMERIC(11,8) NOT NULL,
        osm_type VARCHAR(50),
        osm_id BIGINT,
        address VARCHAR(500),
        phone VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created hospitals table');

    // Create index on hospitals
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hospitals_place_id 
      ON hospitals(place_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_hospitals_location 
      ON hospitals(latitude, longitude)
    `);

    console.log('✅ Created hospital indexes\n');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createEmergencyServicesTable().catch(console.error);
