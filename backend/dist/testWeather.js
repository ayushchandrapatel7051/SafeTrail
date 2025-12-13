#!/usr/bin/env node
/**
 * Test Weather API Integration
 * Run this to verify your OpenWeatherMap API key works
 */
import 'dotenv/config';
const API_KEY = process.env.OPENWEATHER_API_KEY;
if (!API_KEY) {
    console.error('❌ OPENWEATHER_API_KEY not found in .env file');
    process.exit(1);
}
console.log('🔑 API Key found:', API_KEY.substring(0, 8) + '...');
// Test coordinates (New Delhi)
const lat = 28.6139;
const lon = 77.209;
async function testWeatherAPI() {
    console.log('\n📡 Testing Weather API...');
    try {
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        const response = await fetch(weatherUrl);
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ Weather API Error:', error.message);
            console.error('Status Code:', response.status);
            if (response.status === 401) {
                console.error('\n💡 Possible reasons:');
                console.error('   1. API key is not activated yet (wait 10-15 minutes after creation)');
                console.error('   2. API key is incorrect or invalid');
                console.error('   3. API key was revoked');
                console.error('\n🔗 Get a new API key at: https://openweathermap.org/api');
            }
            return false;
        }
        const data = await response.json();
        console.log('✅ Weather API Working!');
        console.log('   Temperature:', data.main.temp + '°C');
        console.log('   Condition:', data.weather[0].main);
        console.log('   Description:', data.weather[0].description);
        console.log('   Humidity:', data.main.humidity + '%');
        console.log('   Wind Speed:', data.wind.speed + ' m/s');
        return true;
    }
    catch (error) {
        console.error('❌ Error fetching weather:', error.message);
        return false;
    }
}
async function testAQIAPI() {
    console.log('\n📡 Testing Air Quality API...');
    try {
        const aqiUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        const response = await fetch(aqiUrl);
        if (!response.ok) {
            const error = await response.json();
            console.error('❌ AQI API Error:', error.message);
            return false;
        }
        const data = await response.json();
        const aqiValue = data.list[0].main.aqi;
        const categories = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
        console.log('✅ AQI API Working!');
        console.log('   AQI:', aqiValue);
        console.log('   Category:', categories[aqiValue]);
        return true;
    }
    catch (error) {
        console.error('❌ Error fetching AQI:', error.message);
        return false;
    }
}
async function main() {
    console.log('🧪 SafeTrail Weather API Test\n');
    console.log('Testing location: New Delhi (28.6139, 77.209)\n');
    const weatherOk = await testWeatherAPI();
    const aqiOk = await testAQIAPI();
    console.log('\n' + '='.repeat(50));
    if (weatherOk && aqiOk) {
        console.log('✅ All tests passed! Weather integration is ready.');
        console.log('\n🚀 Restart your backend server to see weather data in the app.');
    }
    else {
        console.log('❌ Tests failed. Please fix the issues above.');
        console.log('\n📝 Steps to fix:');
        console.log('   1. Get a valid API key from https://openweathermap.org/api');
        console.log('   2. Update OPENWEATHER_API_KEY in backend/.env');
        console.log('   3. Wait 10-15 minutes for key activation');
        console.log('   4. Run this test again: node dist/testWeather.js');
    }
    console.log('='.repeat(50) + '\n');
}
main();
//# sourceMappingURL=testWeather.js.map