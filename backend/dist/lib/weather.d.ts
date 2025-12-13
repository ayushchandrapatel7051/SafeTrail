interface WeatherData {
    temperature: number;
    weatherCondition: string;
    weatherDescription: string;
    weatherIcon: string;
    humidity: number;
    windSpeed: number;
}
interface AQIData {
    aqi: number;
    aqiCategory: string;
}
interface WeatherAQIData extends WeatherData, AQIData {
    updatedAt: Date;
}
/**
 * Fetch weather data for a city
 */
export declare function fetchWeatherData(latitude: number, longitude: number): Promise<WeatherData | null>;
/**
 * Fetch air quality index (AQI) for a city
 */
export declare function fetchAQIData(latitude: number, longitude: number): Promise<AQIData | null>;
/**
 * Fetch both weather and AQI data for a city
 */
export declare function fetchWeatherAndAQI(latitude: number, longitude: number): Promise<WeatherAQIData | null>;
/**
 * Check if weather data needs update (older than 30 minutes)
 */
export declare function needsWeatherUpdate(lastUpdate: Date | null): boolean;
export {};
//# sourceMappingURL=weather.d.ts.map