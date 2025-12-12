import { query } from './connection.js';
import bcrypt from 'bcryptjs';
async function seed() {
    try {
        console.log('🌱 Seeding database...');
        // Clear existing data
        await query('TRUNCATE TABLE alerts, report_photos, reports, places, cities, countries, users RESTART IDENTITY CASCADE;');
        // Create users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const adminResult = await query('INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id', ['admin@safetrail.com', hashedPassword, 'Admin User', 'admin']);
        const adminId = adminResult.rows[0].id;
        const userResult = await query('INSERT INTO users (email, password_hash, full_name, role) VALUES ($1, $2, $3, $4) RETURNING id', ['user@safetrail.com', hashedPassword, 'Test User', 'user']);
        const userId = userResult.rows[0].id;
        // Create countries
        const countries = [
            { name: 'India', code: 'IN' },
        ];
        const countryIds = [];
        for (const country of countries) {
            const result = await query('INSERT INTO countries (name, code) VALUES ($1, $2) RETURNING id', [country.name, country.code]);
            countryIds.push(result.rows[0].id);
        }
        // Create cities
        const cities = [
            { countryIdx: 0, name: 'New Delhi', lat: 28.6139, lng: 77.2090 },
            { countryIdx: 0, name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
            { countryIdx: 0, name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
            { countryIdx: 0, name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
        ];
        const cityIds = [];
        for (const city of cities) {
            const result = await query('INSERT INTO cities (country_id, name, latitude, longitude, safety_score) VALUES ($1, $2, $3, $4, $5) RETURNING id', [countryIds[city.countryIdx], city.name, city.lat, city.lng, Math.random() * 30 + 60]);
            cityIds.push(result.rows[0].id);
        }
        // Create places
        const places = [
            { cityIdx: 0, name: 'Connaught Place', lat: 28.6315, lng: 77.2167, type: 'market', score: 85 },
            { cityIdx: 0, name: 'Chandni Chowk', lat: 28.6506, lng: 77.2303, type: 'market', score: 62 },
            { cityIdx: 0, name: 'India Gate', lat: 28.6129, lng: 77.2295, type: 'landmark', score: 92 },
            { cityIdx: 0, name: 'Paharganj', lat: 28.6448, lng: 77.2140, type: 'neighborhood', score: 45 },
            { cityIdx: 1, name: 'Gateway of India', lat: 18.9220, lng: 72.8347, type: 'landmark', score: 88 },
            { cityIdx: 1, name: 'Colaba', lat: 18.9067, lng: 72.8147, type: 'neighborhood', score: 75 },
            { cityIdx: 1, name: 'Dharavi', lat: 19.0430, lng: 72.8550, type: 'neighborhood', score: 35 },
            { cityIdx: 1, name: 'Bandra', lat: 19.0596, lng: 72.8295, type: 'neighborhood', score: 82 },
        ];
        const placeIds = [];
        for (const place of places) {
            const result = await query('INSERT INTO places (city_id, name, latitude, longitude, type, safety_score) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id', [cityIds[place.cityIdx], place.name, place.lat, place.lng, place.type, place.score]);
            placeIds.push(result.rows[0].id);
        }
        // Create reports
        const reports = [
            { placeIdx: 3, type: 'theft', description: 'Pickpocket incident near main bazaar', status: 'verified', lat: 28.6448, lng: 77.2140 },
            { placeIdx: 1, type: 'harassment', description: 'Aggressive vendors and touts', status: 'pending', lat: 28.6506, lng: 77.2303 },
            { placeIdx: 6, type: 'scam', description: 'Fake tour guide demanding money', status: 'pending', lat: 19.0430, lng: 72.8550 },
            { placeIdx: 2, type: 'theft', description: 'Bag snatching reported near market entrance', status: 'verified', lat: 28.5745, lng: 77.1989 },
        ];
        for (const report of reports) {
            await query('INSERT INTO reports (user_id, place_id, type, description, latitude, longitude, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [userId, placeIds[report.placeIdx], report.type, report.description, report.lat, report.lng, report.status]);
        }
        // Create alerts
        await query('INSERT INTO alerts (title, body, severity, created_by) VALUES ($1, $2, $3, $4)', ['Festival Crowd Alert', 'Large crowds expected in Chandni Chowk area. Stay vigilant.', 2, adminId]);
        await query('INSERT INTO alerts (title, body, severity, created_by) VALUES ($1, $2, $3, $4)', ['Weather Warning', 'Heavy fog expected. Avoid night travel in isolated areas.', 1, adminId]);
        console.log('✅ Database seeded successfully');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seed error:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map