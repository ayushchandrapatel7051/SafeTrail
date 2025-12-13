import { query } from '../connection.js';

export async function up() {
  await query(`
    CREATE TABLE IF NOT EXISTS attractions (
      id SERIAL PRIMARY KEY,
      city_id INTEGER NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      latitude DECIMAL(10, 8) NOT NULL,
      longitude DECIMAL(11, 8) NOT NULL,
      rating DECIMAL(3, 2) DEFAULT 4.0,
      estimated_duration INTEGER DEFAULT 120,
      best_time_to_visit VARCHAR(50),
      entry_fee DECIMAL(10, 2) DEFAULT 0,
      image_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_attractions_city_id ON attractions(city_id);
    CREATE INDEX IF NOT EXISTS idx_attractions_category ON attractions(category);
  `);
}

export async function down() {
  await query('DROP TABLE IF EXISTS attractions CASCADE');
}
