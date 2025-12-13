# 🌤️ Quick Start: Weather & AQI Feature

## Get Started in 3 Steps

### Step 1: Get OpenWeatherMap API Key (2 minutes)

1. Go to https://openweathermap.org/api
2. Click "Sign Up" (top right)
3. Create a free account
4. Go to "API Keys" tab
5. Copy your API key

### Step 2: Configure Backend (30 seconds)

Open `backend/.env` and add:

```env
OPENWEATHER_API_KEY=paste_your_key_here
```

### Step 3: Restart & View (1 minute)

```bash
# Terminal 1 - Backend (if not already running)
cd backend
npm run dev

# Terminal 2 - Frontend (if not already running)
cd frontend
npm run dev
```

Then visit: http://localhost:5173/map

## ✨ Where to See It

### In the Sidebar
- Below the city dropdown
- Shows current weather with icon
- Displays humidity & wind speed
- Color-coded AQI badge

### On the Map
- Top-left corner overlay
- Compact weather info card
- Quick glance at conditions

## 🎯 What You'll See

**Weather Info:**
- 🌡️ Temperature in Celsius
- ☁️ Current conditions (Clear, Clouds, Rain, etc.)
- 💧 Humidity percentage
- 💨 Wind speed in m/s

**Air Quality:**
- Color-coded badge
- Categories: Good → Fair → Moderate → Poor → Very Poor
- Based on WHO standards

## 🔄 Data Refresh

- Updates automatically every 30 minutes
- First time viewing a city fetches fresh data
- Subsequent views use cached data (if fresh)

## ❓ Troubleshooting

**No weather showing?**
- Check if `OPENWEATHER_API_KEY` is set in `.env`
- Verify API key is valid at OpenWeatherMap
- Restart backend server after adding key
- Check browser console for errors

**API key not working?**
- New API keys can take 10-15 minutes to activate
- Free tier limit: 1,000 calls/day
- Check your email for activation confirmation

## 📝 Note

The free OpenWeatherMap API tier is more than sufficient for development and moderate production use. Each city's weather data is cached and only updated every 30 minutes, minimizing API calls.

Enjoy your enhanced SafeTrail experience! 🚀
