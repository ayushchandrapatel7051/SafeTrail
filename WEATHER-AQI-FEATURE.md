# Weather and Air Quality Integration

SafeTrail now displays real-time weather and air quality information for each city!

## Features Added

### Backend
- **Weather Data**: Temperature, conditions, humidity, and wind speed
- **Air Quality Index (AQI)**: Real-time air quality monitoring with categories (Good, Fair, Moderate, Poor, Very Poor)
- **Automatic Updates**: Weather data refreshes every 30 minutes
- **Caching**: Efficient caching to minimize API calls

### Frontend
- **Sidebar Display**: Weather card showing current conditions and AQI in the city selector sidebar
- **Map Overlay**: Compact weather/AQI card on the map view
- **Visual Indicators**: 
  - Weather icons from OpenWeatherMap
  - Color-coded AQI badges
  - Temperature, humidity, and wind speed display

## Setup

### 1. Get OpenWeatherMap API Key

1. Visit [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Generate an API key (Free tier includes 1,000 calls/day)

### 2. Configure Environment Variable

Add to your `backend/.env` file:

```env
OPENWEATHER_API_KEY=your_api_key_here
```

### 3. Run Migration

The weather and AQI columns are automatically added during migration:

```bash
cd backend
npm run db:migrate
```

### 4. Start the Application

```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## How It Works

1. **Data Collection**: When cities are requested, the backend checks if weather data needs updating (older than 30 minutes)
2. **API Calls**: If needed, it fetches data from OpenWeatherMap's Weather and Air Pollution APIs
3. **Database Storage**: Weather and AQI data is stored in the cities table
4. **Display**: Frontend shows the data in both the sidebar and on the map

## API Endpoints

The existing city endpoints now return additional fields:

```json
{
  "id": 1,
  "name": "Paris",
  "temperature": 18.5,
  "weather_condition": "Clear",
  "weather_description": "clear sky",
  "weather_icon": "01d",
  "humidity": 65,
  "wind_speed": 3.2,
  "aqi": 2,
  "aqi_category": "Fair",
  "weather_updated_at": "2025-12-13T10:30:00.000Z"
}
```

## AQI Categories

- **1 - Good**: Air quality is satisfactory
- **2 - Fair**: Air quality is acceptable
- **3 - Moderate**: May affect sensitive individuals
- **4 - Poor**: Health effects for everyone
- **5 - Very Poor**: Serious health effects

## Notes

- Weather data updates automatically every 30 minutes
- If no API key is configured, the feature gracefully degrades (no weather data shown)
- Free tier API key is sufficient for most use cases
- Data is cached to optimize API usage and performance
