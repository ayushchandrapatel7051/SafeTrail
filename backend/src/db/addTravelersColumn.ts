import { query } from './connection.js';

async function addTravelersColumn() {
  try {
    console.log('Adding travelers column to trip_plans table...');

    // Add travelers column as JSONB to store array of traveler objects
    await query(`
      ALTER TABLE trip_plans 
      ADD COLUMN IF NOT EXISTS travelers JSONB DEFAULT '[]'::jsonb
    `);

    console.log('✅ Added travelers column to trip_plans table');

    process.exit(0);
  } catch (error) {
    console.error('Error adding travelers column:', error);
    process.exit(1);
  }
}

addTravelersColumn();
