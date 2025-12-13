import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import { Link, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { getSafetyStatus } from '@/data/mockData';
import { cities as citiesApi, places as placesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

interface City {
  id: number;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  temperature?: number;
  weatherCondition?: string;
  weatherDescription?: string;
  weatherIcon?: string;
  humidity?: number;
  windSpeed?: number;
  aqi?: number;
  aqiCategory?: string;
  weatherUpdatedAt?: string;
}

interface Place {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  safetyScore: number;
  reportCount: number;
  cityId: number;
}

const getMarkerIcon = (score: number) => {
  const status = getSafetyStatus(score);
  let color: string;
  let bgColor: string;

  if (status === 'safe') {
    color = '#22c55e';
    bgColor = '#16a34a';
  } else if (status === 'caution') {
    color = '#f59e0b';
    bgColor = '#d97706';
  } else {
    color = '#ef4444';
    bgColor = '#dc2626';
  }

  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 24 24">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        <g filter="url(#shadow)">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="${color}" stroke="${bgColor}" stroke-width="1.5"/>
          <circle cx="12" cy="10" r="3.5" fill="white"/>
        </g>
      </svg>
    `)}`,
    iconSize: [40, 50],
    iconAnchor: [20, 50],
    popupAnchor: [0, -50],
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    shadowSize: [41, 41],
    shadowAnchor: [13, 41],
  });
};

const getZoneColor = (score: number) => {
  const status = getSafetyStatus(score);
  if (status === 'safe') return { color: '#22c55e', fillColor: '#22c55e' };
  if (status === 'caution') return { color: '#f59e0b', fillColor: '#f59e0b' };
  return { color: '#ef4444', fillColor: '#ef4444' };
};

// Map controller component for auto-centering and fitting bounds
const MapController = ({
  city,
  places,
  selectedPlace,
}: {
  city: City | undefined;
  places: Place[];
  selectedPlace: Place | null;
}) => {
  const map = useMap();

  useEffect(() => {
    if (!city || typeof city.latitude !== 'number' || typeof city.longitude !== 'number') return;

    try {
      // If a specific place is selected, zoom into that location
      if (
        selectedPlace &&
        typeof selectedPlace.latitude === 'number' &&
        typeof selectedPlace.longitude === 'number'
      ) {
        map.setView([selectedPlace.latitude, selectedPlace.longitude], 16);
      } else {
        // Filter out places with invalid coordinates
        const validPlaces = places.filter(
          (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
        );

        if (validPlaces.length > 0) {
          // Create bounds from all places
          const bounds = new LatLngBounds(validPlaces.map((p) => [p.latitude, p.longitude]));
          // Fit map to bounds with padding
          map.fitBounds(bounds, { padding: [100, 100], maxZoom: 14 });
        } else {
          // Center on city if no valid places
          map.setView([city.latitude, city.longitude], 12);
        }
      }
    } catch (error) {
      console.error('Error setting map view:', error);
      // Fallback to city center
      if (typeof city.latitude === 'number' && typeof city.longitude === 'number') {
        map.setView([city.latitude, city.longitude], 12);
      }
    }
  }, [city, places, map, selectedPlace]);

  return null;
};

const MapView = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Fetch cities and places from API
        const [citiesData, placesData] = await Promise.all([
          citiesApi.getAll(),
          placesApi.getAll(),
        ]);

        const transformedCities = citiesData.map((city: Record<string, unknown>) => ({
          id: city.id as number,
          name: city.name as string,
          country: (city.country_name || city.country) as string,
          latitude: parseFloat(city.latitude as string),
          longitude: parseFloat(city.longitude as string),
          safetyScore: parseFloat(city.safety_score as string),
          temperature: city.temperature ? parseFloat(city.temperature as string) : undefined,
          weatherCondition: city.weather_condition as string | undefined,
          weatherDescription: city.weather_description as string | undefined,
          weatherIcon: city.weather_icon as string | undefined,
          humidity: city.humidity ? parseInt(city.humidity as string) : undefined,
          windSpeed: city.wind_speed ? parseFloat(city.wind_speed as string) : undefined,
          aqi: city.aqi ? parseInt(city.aqi as string) : undefined,
          aqiCategory: city.aqi_category as string | undefined,
          weatherUpdatedAt: city.weather_updated_at as string | undefined,
        }));

        const transformedPlaces = placesData.map((place: Record<string, unknown>) => ({
          id: place.id as number,
          name: place.name as string,
          type: (place.type || place.category) as string,
          latitude: parseFloat(place.latitude as string),
          longitude: parseFloat(place.longitude as string),
          safetyScore: parseFloat(place.safety_score as string),
          reportCount: (place.report_count || 0) as number,
          cityId: place.city_id as number,
        }));

        console.log('Loaded cities:', transformedCities);
        console.log('Loaded places:', transformedPlaces);

        setCities(transformedCities);
        setPlaces(transformedPlaces);

        // Check for city parameter in URL
        const cityParam = searchParams.get('city');
        if (cityParam) {
          const cityId = parseInt(cityParam, 10);
          // Verify the city exists in the data
          if (transformedCities.some((c: City) => c.id === cityId)) {
            setSelectedCity(cityId);
          } else if (transformedCities.length > 0) {
            // Fall back to first city if specified city not found
            setSelectedCity(transformedCities[0].id);
          }
        } else if (transformedCities.length > 0) {
          // Default to first city if no parameter specified
          setSelectedCity(transformedCities[0].id);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [searchParams]);

  // Separate effect to handle place parameter after data is loaded
  useEffect(() => {
    if (places.length === 0) return;

    const placeParam = searchParams.get('place');
    if (placeParam) {
      const placeId = parseInt(placeParam, 10);
      const place = places.find((p) => p.id === placeId);
      if (place) {
        setSelectedPlace(place);
      }
    }
  }, [searchParams, places]);

  const currentCity = cities.find((c) => c.id === selectedCity);
  const cityPlaces = places.filter((p) => p.cityId === selectedCity);

  if (isLoading || !currentCity) {
    return (
      <DashboardLayout>
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row h-full">
        {/* Sidebar */}
        <aside className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-card overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <h2 className="font-semibold mb-3">Select City</h2>
              <Select
                value={selectedCity?.toString() || ''}
                onValueChange={(v) => setSelectedCity(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Weather and AQI Card */}
            {currentCity && (currentCity.temperature !== undefined || currentCity.aqi !== undefined) && (
              <Card className="mb-4 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-lg">🌤️</span>
                    Weather & Air Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {currentCity.temperature !== undefined && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {currentCity.weatherIcon && (
                          <img
                            src={`https://openweathermap.org/img/wn/${currentCity.weatherIcon}.png`}
                            alt={currentCity.weatherDescription || 'Weather'}
                            className="w-10 h-10"
                          />
                        )}
                        <div>
                          <div className="text-2xl font-bold text-blue-900">
                            {currentCity.temperature}°C
                          </div>
                          <div className="text-xs text-blue-700 capitalize">
                            {currentCity.weatherDescription || currentCity.weatherCondition}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs text-blue-700 space-y-1">
                        {currentCity.humidity !== undefined && (
                          <div>💧 {currentCity.humidity}%</div>
                        )}
                        {currentCity.windSpeed !== undefined && (
                          <div>💨 {currentCity.windSpeed} m/s</div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {currentCity.aqi !== undefined && (
                    <div className="pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-800">Air Quality</span>
                        <Badge
                          className={`font-semibold ${
                            currentCity.aqi === 1
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : currentCity.aqi === 2
                                ? 'bg-lime-100 text-lime-800 border-lime-300'
                                : currentCity.aqi === 3
                                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                  : currentCity.aqi === 4
                                    ? 'bg-orange-100 text-orange-800 border-orange-300'
                                    : 'bg-red-100 text-red-800 border-red-300'
                          } border`}
                        >
                          {currentCity.aqiCategory || 'AQI ' + currentCity.aqi}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <h2 className="font-semibold mb-4">Places in {currentCity?.name}</h2>

            {/* Legend */}
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 space-y-3">
              <h3 className="font-semibold text-sm text-blue-900 mb-3">Safety Score Legend</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500 shadow-md"></div>
                  <span className="text-xs font-medium text-gray-700">
                    <span className="font-semibold text-green-600">Safe</span> (80-100)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-md"></div>
                  <span className="text-xs font-medium text-gray-700">
                    <span className="font-semibold text-yellow-600">Caution</span> (50-79)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-red-500 shadow-md"></div>
                  <span className="text-xs font-medium text-gray-700">
                    <span className="font-semibold text-red-600">Risky</span> (0-49)
                  </span>
                </div>
              </div>
              <p className="text-xs text-blue-800 pt-2 border-t border-blue-200">
                📍 Shaded circles show safety zones (500m radius)
              </p>
            </div>

            <div className="space-y-2">
              {cityPlaces.map((place) => {
                const status = getSafetyStatus(place.safetyScore);
                let badgeClass = '';
                let dotColor = '';

                if (status === 'safe') {
                  badgeClass = 'bg-green-100 text-green-800 border-green-300';
                  dotColor = 'bg-green-500';
                } else if (status === 'caution') {
                  badgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
                  dotColor = 'bg-yellow-500';
                } else {
                  badgeClass = 'bg-red-100 text-red-800 border-red-300';
                  dotColor = 'bg-red-500';
                }

                return (
                  <Card
                    key={place.id}
                    className={`cursor-pointer transition-all hover:shadow-lg border-l-4 ${
                      status === 'safe'
                        ? 'border-l-green-500'
                        : status === 'caution'
                          ? 'border-l-yellow-500'
                          : 'border-l-red-500'
                    } ${selectedPlace?.id === place.id ? 'ring-2 ring-primary shadow-lg' : ''}`}
                    onClick={() => setSelectedPlace(place)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-medium text-sm">{place.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{place.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                          <Badge className={`${badgeClass} border font-semibold`}>
                            {place.safetyScore}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="text-muted-foreground">
                          📍 {place.reportCount} {place.reportCount === 1 ? 'report' : 'reports'}
                        </div>
                        <span
                          className={`font-semibold ${
                            status === 'safe'
                              ? 'text-green-600'
                              : status === 'caution'
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {status === 'safe'
                            ? '✓ Safe'
                            : status === 'caution'
                              ? '⚠ Caution'
                              : '✕ Risky'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          {currentCity &&
            typeof currentCity.latitude === 'number' &&
            typeof currentCity.longitude === 'number' && (
              <MapContainer
                center={[currentCity.latitude, currentCity.longitude]}
                zoom={12}
                className="h-full w-full"
                key={selectedCity}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Safety zones */}
                {cityPlaces.map((place) => (
                  <Circle
                    key={`zone-${place.id}`}
                    center={[place.latitude, place.longitude]}
                    radius={500}
                    pathOptions={{
                      ...getZoneColor(place.safetyScore),
                      fillOpacity: 0.2,
                      weight: 1,
                    }}
                  />
                ))}

                {/* Markers */}
                {cityPlaces.map((place) => (
                  <Marker
                    key={place.id}
                    position={[place.latitude, place.longitude]}
                    icon={getMarkerIcon(place.safetyScore)}
                    eventHandlers={{
                      click: () => setSelectedPlace(place),
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-semibold text-sm">{place.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{place.type}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs">Safety Score:</span>
                          <span
                            className={`font-bold ${
                              getSafetyStatus(place.safetyScore) === 'safe'
                                ? 'text-green-600'
                                : getSafetyStatus(place.safetyScore) === 'caution'
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {place.safetyScore}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {place.reportCount} reports
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}

                <MapController
                  city={currentCity}
                  places={cityPlaces}
                  selectedPlace={selectedPlace}
                />
              </MapContainer>
            )}

          {/* City Weather/AQI Info Card on Map */}
          {currentCity && (currentCity.temperature !== undefined || currentCity.aqi !== undefined) && (
            <Card className="absolute top-4 right-4 z-[1000] shadow-lg bg-white/95 backdrop-blur-sm border-blue-200 max-w-xs">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-3">
                  {currentCity.temperature !== undefined && (
                    <div className="flex items-center gap-2">
                      {currentCity.weatherIcon && (
                        <img
                          src={`https://openweathermap.org/img/wn/${currentCity.weatherIcon}.png`}
                          alt={currentCity.weatherDescription || 'Weather'}
                          className="w-12 h-12"
                        />
                      )}
                      <div>
                        <div className="text-xl font-bold text-gray-900">
                          {currentCity.temperature}°C
                        </div>
                        <div className="text-xs text-gray-600 capitalize">
                          {currentCity.weatherDescription}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {currentCity.humidity !== undefined && `💧 ${currentCity.humidity}%`}
                          {currentCity.windSpeed !== undefined && ` • 💨 ${currentCity.windSpeed} m/s`}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {currentCity.aqi !== undefined && (
                    <div className="text-right">
                      <div className="text-xs text-gray-600 mb-1">AQI</div>
                      <Badge
                        className={`font-semibold ${
                          currentCity.aqi === 1
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : currentCity.aqi === 2
                              ? 'bg-lime-100 text-lime-800 border-lime-300'
                              : currentCity.aqi === 3
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : currentCity.aqi === 4
                                  ? 'bg-orange-100 text-orange-800 border-orange-300'
                                  : 'bg-red-100 text-red-800 border-red-300'
                        } border text-xs`}
                      >
                        {currentCity.aqiCategory}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected place details */}
          {selectedPlace && (
            <Card
              className={`absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-[1000] shadow-2xl border-2 ${
                getSafetyStatus(selectedPlace.safetyScore) === 'safe'
                  ? 'border-green-300 bg-green-50/50'
                  : getSafetyStatus(selectedPlace.safetyScore) === 'caution'
                    ? 'border-yellow-300 bg-yellow-50/50'
                    : 'border-red-300 bg-red-50/50'
              }`}
            >
              <CardHeader className="pb-3 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{selectedPlace.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize mt-1">
                      {selectedPlace.type}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedPlace(null)}
                    className="text-muted-foreground hover:text-foreground text-2xl font-light leading-none"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Safety Score Display */}
                <div
                  className={`rounded-lg p-4 mb-4 ${
                    getSafetyStatus(selectedPlace.safetyScore) === 'safe'
                      ? 'bg-green-100 border border-green-300'
                      : getSafetyStatus(selectedPlace.safetyScore) === 'caution'
                        ? 'bg-yellow-100 border border-yellow-300'
                        : 'bg-red-100 border border-red-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSafetyStatus(selectedPlace.safetyScore) === 'safe' && (
                        <Shield className="w-6 h-6 text-green-700" />
                      )}
                      {getSafetyStatus(selectedPlace.safetyScore) === 'caution' && (
                        <AlertTriangle className="w-6 h-6 text-yellow-700" />
                      )}
                      {getSafetyStatus(selectedPlace.safetyScore) === 'danger' && (
                        <AlertCircle className="w-6 h-6 text-red-700" />
                      )}
                      <div>
                        <p className="text-xs font-semibold opacity-75">Safety Score</p>
                        <p className="text-3xl font-bold">
                          {selectedPlace.safetyScore}
                          <span className="text-lg font-normal opacity-60">/100</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {getSafetyStatus(selectedPlace.safetyScore) === 'safe'
                          ? '✓ SAFE'
                          : getSafetyStatus(selectedPlace.safetyScore) === 'caution'
                            ? '⚠ CAUTION'
                            : '✕ RISKY'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reports */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-xs text-muted-foreground mb-1">Community Reports</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {selectedPlace.reportCount}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {selectedPlace.reportCount === 1 ? 'incident reported' : 'incidents reported'}
                    </span>
                  </div>
                </div>

                {/* Action Button */}
                <Link to={`/report?place=${selectedPlace.id}`} className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 font-semibold">
                    Report Incident Here
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default MapView;
