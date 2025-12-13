import { Router } from 'express';
import { query } from '../db/connection.js';
import { redis } from '../lib/redis.js';
import { fetchWeatherAndAQI, needsWeatherUpdate } from '../lib/weather.js';
const router = Router();
// Helper function to update weather data for a city
async function updateCityWeather(cityId, latitude, longitude) {
    try {
        const weatherData = await fetchWeatherAndAQI(latitude, longitude);
        if (weatherData) {
            await query(`UPDATE cities 
         SET temperature = $1, weather_condition = $2, weather_description = $3, 
             weather_icon = $4, humidity = $5, wind_speed = $6, 
             aqi = $7, aqi_category = $8, weather_updated_at = $9
         WHERE id = $10`, [
                weatherData.temperature,
                weatherData.weatherCondition,
                weatherData.weatherDescription,
                weatherData.weatherIcon,
                weatherData.humidity,
                weatherData.windSpeed,
                weatherData.aqi,
                weatherData.aqiCategory,
                weatherData.updatedAt,
                cityId,
            ]);
            // Clear cache for this city
            await redis.delete(`city:${cityId}`);
            await redis.delete('cities:all');
        }
    }
    catch (error) {
        console.error(`Error updating weather for city ${cityId}:`, error);
    }
}
// Get all cities
router.get('/', async (req, res) => {
    try {
        const cacheKey = 'cities:all';
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const result = await query(`SELECT c.id, c.country_id, c.name, c.latitude, c.longitude, c.safety_score, 
              c.places_count, c.reports_count, co.name as country_name, co.code as country_code,
              c.temperature, c.weather_condition, c.weather_description, c.weather_icon,
              c.humidity, c.wind_speed, c.aqi, c.aqi_category, c.weather_updated_at
       FROM cities c
       LEFT JOIN countries co ON c.country_id = co.id
       ORDER BY c.name`);
        const cities = result.rows;
        // Update weather data for cities that need it (fire and forget)
        cities.forEach((city) => {
            if (needsWeatherUpdate(city.weather_updated_at)) {
                updateCityWeather(city.id, parseFloat(city.latitude), parseFloat(city.longitude));
            }
        });
        // Cache for 10 minutes (weather updates every 30 min)
        await redis.set(cacheKey, cities, 600);
        res.json(cities);
    }
    catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({ error: 'Failed to fetch cities' });
    }
});
// Get city by ID with stats
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const cacheKey = `city:${id}`;
        const cached = await redis.get(cacheKey);
        if (cached) {
            return res.json(cached);
        }
        const cityResult = await query(`SELECT c.id, c.country_id, c.name, c.latitude, c.longitude, c.safety_score, 
              c.places_count, c.reports_count, co.name as country_name, co.code as country_code,
              c.temperature, c.weather_condition, c.weather_description, c.weather_icon,
              c.humidity, c.wind_speed, c.aqi, c.aqi_category, c.weather_updated_at
       FROM cities c
       LEFT JOIN countries co ON c.country_id = co.id
       WHERE c.id = $1`, [id]);
        if (cityResult.rows.length === 0) {
            return res.status(404).json({ error: 'City not found' });
        }
        const city = cityResult.rows[0];
        // Update weather data if needed (fire and forget)
        if (needsWeatherUpdate(city.weather_updated_at)) {
            updateCityWeather(city.id, parseFloat(city.latitude), parseFloat(city.longitude));
        }
        // Get places in city
        const placesResult = await query('SELECT id, name, latitude, longitude, type, safety_score, report_count FROM places WHERE city_id = $1', [id]);
        // Get recent alerts for city
        const alertsResult = await query('SELECT id, title, body, severity, created_at FROM alerts WHERE location_type = $1 OR location_id = $2 ORDER BY created_at DESC LIMIT 5', ['city', id]);
        const cityWithDetails = {
            ...city,
            places: placesResult.rows,
            alerts: alertsResult.rows,
        };
        // Cache for 10 minutes
        await redis.set(cacheKey, cityWithDetails, 600);
        res.json(cityWithDetails);
    }
    catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({ error: 'Failed to fetch city' });
    }
});
export default router;
//# sourceMappingURL=cities.js.map