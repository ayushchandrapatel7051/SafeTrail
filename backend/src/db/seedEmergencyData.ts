import pool from './connection';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function seedEmergencyData() {
  const client = await pool.connect();

  try {
    // Read data.json from app directory
    const dataPath = path.join(__dirname, '../../data.json');
    console.log(`Reading from: ${dataPath}`);
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(rawData);

    console.log(`📊 Found ${data.length} places with emergency data\n`);

    let emergencyCount = 0;
    let hospitalCount = 0;

    for (const place of data) {
      // Insert emergency services
      if (place.emergency) {
        await client.query(
          `INSERT INTO emergency_services 
           (place_id, police_number, ambulance_number, fire_number, women_helpline, tourist_helpline,
            nearest_police_name, nearest_police_distance_m, nearest_police_lat, nearest_police_lon,
            nearest_police_osm_type, nearest_police_osm_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT DO NOTHING`,
          [
            place.id,
            place.emergency.police || null,
            place.emergency.ambulance || null,
            place.emergency.fire || null,
            place.emergency.women_helpline || null,
            place.emergency.tourist_helpline || null,
            place.nearest_police?.name || null,
            place.nearest_police?.distance_m || null,
            place.nearest_police?.lat || null,
            place.nearest_police?.lon || null,
            place.nearest_police?.osm_type || null,
            place.nearest_police?.osm_id || null,
          ]
        );
        emergencyCount++;
      }

      // Insert hospitals
      if (place.nearest_hospitals && Array.isArray(place.nearest_hospitals)) {
        for (const hospital of place.nearest_hospitals) {
          await client.query(
            `INSERT INTO hospitals 
             (place_id, name, distance_m, latitude, longitude, osm_type, osm_id, address, phone, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT DO NOTHING`,
            [
              place.id,
              hospital.name || 'Unknown Hospital',
              hospital.distance_m || null,
              hospital.lat || 0,
              hospital.lon || 0,
              hospital.osm_type || null,
              hospital.osm_id || null,
              hospital.tags?.['addr:full'] || hospital.tags?.['addr:street'] || null,
              hospital.tags?.['contact:phone'] || null,
              hospital.tags?.description || null,
            ]
          );
          hospitalCount++;
        }
      }
    }

    console.log(`✅ Seeded ${emergencyCount} emergency service records`);
    console.log(`✅ Seeded ${hospitalCount} hospital records\n`);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedEmergencyData().catch(console.error);
