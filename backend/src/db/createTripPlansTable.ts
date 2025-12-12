import { query } from './connection.js';

async function createTripPlansTable() {
  try {
    console.log('Creating trip_plans and trip_plan_items tables...');

    // Create trip_plans table
    await query(`
      CREATE TABLE IF NOT EXISTS trip_plans (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        city_id INTEGER REFERENCES cities(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        preferences TEXT[], -- Array of preferences: safety, tourist, nightlife, culture
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created trip_plans table');

    // Create trip_plan_items table (itinerary items)
    await query(`
      CREATE TABLE IF NOT EXISTS trip_plan_items (
        id SERIAL PRIMARY KEY,
        trip_plan_id INTEGER REFERENCES trip_plans(id) ON DELETE CASCADE,
        place_id INTEGER REFERENCES places(id) ON DELETE CASCADE,
        attraction_id INTEGER REFERENCES attractions(id) ON DELETE CASCADE,
        day_number INTEGER NOT NULL, -- Which day of the trip (1, 2, 3, etc.)
        time_slot VARCHAR(50), -- morning, afternoon, evening, night
        start_time TIME,
        notes TEXT,
        order_index INTEGER NOT NULL, -- Order within the day
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT valid_reference CHECK (
          (place_id IS NOT NULL AND attraction_id IS NULL) OR
          (place_id IS NULL AND attraction_id IS NOT NULL)
        )
      )
    `);

    console.log('✅ Created trip_plan_items table');

    // Create indexes
    await query(`
      CREATE INDEX IF NOT EXISTS idx_trip_plans_user_id ON trip_plans(user_id);
      CREATE INDEX IF NOT EXISTS idx_trip_plan_items_trip_plan_id ON trip_plan_items(trip_plan_id);
      CREATE INDEX IF NOT EXISTS idx_trip_plan_items_day_number ON trip_plan_items(day_number);
    `);

    console.log('✅ Created indexes');

    // Add category column to attractions if not exists
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='attractions' AND column_name='category') THEN
          ALTER TABLE attractions ADD COLUMN category VARCHAR(50);
        END IF;
      END $$;
    `);

    console.log('✅ Added category column to attractions');

    // Add category to places if not exists
    await query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='places' AND column_name='category') THEN
          ALTER TABLE places ADD COLUMN category VARCHAR(50);
        END IF;
      END $$;
    `);

    console.log('✅ Added category column to places');

    console.log('\n🎉 Trip plans database structure created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating trip plans tables:', error);
    process.exit(1);
  }
}

createTripPlansTable();
