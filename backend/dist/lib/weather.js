// Weather and Air Quality service using OpenWeatherMap API
// Get your free API key from: https://openweathermap.org/api
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '';
// AQI categories based on value
function getAQICategory(aqi) {
    if (aqi === 1)
        return 'Good';
    if (aqi === 2)
        return 'Fair';
    if (aqi === 3)
        return 'Moderate';
    if (aqi === 4)
        return 'Poor';
    if (aqi === 5)
        return 'Very Poor';
    return 'Unknown';
}
/**
 * Fetch weather data for a city
 */
export async function fetchWeatherData(latitude, longitude) {
    if (!OPENWEATHER_API_KEY) {
        console.warn('OpenWeatherMap API key not configured');
        return null;
    }
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Weather API error: ${response.status}`);
            return null;
        }
        const data = await response.json();
        return {
            temperature: Math.round(data.main.temp * 10) / 10,
            weatherCondition: data.weather[0].main,
            weatherDescription: data.weather[0].description,
            weatherIcon: data.weather[0].icon,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * 10) / 10,
        };
    }
    catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}
/**
 * Fetch air quality index (AQI) for a city
 */
export async function fetchAQIData(latitude, longitude) {
    if (!OPENWEATHER_API_KEY) {
        console.warn('OpenWeatherMap API key not configured');
        return null;
    }
    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}`;
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`AQI API error: ${response.status}`);
            return null;
        }
        const data = await response.json();
        const aqiValue = data.list[0].main.aqi;
        return {
            aqi: aqiValue,
            aqiCategory: getAQICategory(aqiValue),
        };
    }
    catch (error) {
        console.error('Error fetching AQI data:', error);
        return null;
    }
}
/**
 * Fetch both weather and AQI data for a city
 */
export async function fetchWeatherAndAQI(latitude, longitude) {
    const [weather, aqi] = await Promise.all([
        fetchWeatherData(latitude, longitude),
        fetchAQIData(latitude, longitude),
    ]);
    if (!weather || !aqi) {
        return null;
    }
    return {
        ...weather,
        ...aqi,
        updatedAt: new Date(),
    };
}
/**
 * Check if weather data needs update (older than 30 minutes)
 */
export function needsWeatherUpdate(lastUpdate) {
    if (!lastUpdate)
        return true;
    const thirtyMinutes = 30 * 60 * 1000;
    const now = new Date().getTime();
    const lastUpdateTime = new Date(lastUpdate).getTime();
    return now - lastUpdateTime > thirtyMinutes;
}
//# sourceMappingURL=weather.js.map