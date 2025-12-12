import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Icon } from "leaflet";
import { Link } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { cities as apiCities, places as apiPlaces } from "@/lib/api";
import { getSafetyStatus } from "@/data/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, AlertTriangle, AlertCircle, Loader2, FileText } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const getMarkerIcon = (score: number) => {
  const status = getSafetyStatus(score);
  const color = status === 'safe' ? '#22c55e' : status === 'caution' ? '#f59e0b' : '#ef4444';
  
  return new Icon({
    iconUrl: `data:image/svg+xml,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    `)}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

const getZoneColor = (score: number) => {
  const status = getSafetyStatus(score);
  if (status === 'safe') return { color: '#22c55e', fillColor: '#22c55e' };
  if (status === 'caution') return { color: '#f59e0b', fillColor: '#f59e0b' };
  return { color: '#ef4444', fillColor: '#ef4444' };
};

const MapView = () => {
  const [cities, setCities] = useState<any[]>([]);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [citiesData, placesData] = await Promise.all([
          apiCities.getAll(),
          apiPlaces.getAll(),
        ]);
        setCities(citiesData);
        setPlaces(placesData);
        if (citiesData.length > 0) {
          setSelectedCity(citiesData[0].id);
        }
      } catch (error) {
        console.error('Error loading map data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const currentCity = cities.find(c => c.id === selectedCity);
  const cityPlaces = places.filter(p => p.city_id === selectedCity);

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
              <Select value={selectedCity?.toString() || ""} onValueChange={(v) => setSelectedCity(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map(city => (
                    <SelectItem key={city.id} value={city.id.toString()}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <h2 className="font-semibold mb-4">Places in {currentCity?.name}</h2>
            
            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs font-medium">Safe</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-xs font-medium">Caution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-xs font-medium">Risky</span>
              </div>
            </div>

            <div className="space-y-2">
              {cityPlaces.map(place => {
                const status = getSafetyStatus(place.safety_score);
                return (
                  <Card 
                    key={place.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedPlace?.id === place.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedPlace(place)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium text-sm">{place.name}</h3>
                          <p className="text-xs text-muted-foreground capitalize">{place.type}</p>
                        </div>
                        <Badge className={`
                          ${status === 'safe' ? 'bg-green-100 text-green-800' : ''}
                          ${status === 'caution' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${status === 'danger' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {place.safety_score}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3" />
                        {place.report_count} reports
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
          {currentCity && (
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
              {cityPlaces.map(place => (
                <Circle
                  key={`zone-${place.id}`}
                  center={[place.latitude, place.longitude]}
                  radius={500}
                  pathOptions={{
                    ...getZoneColor(place.safety_score),
                    fillOpacity: 0.2,
                    weight: 1,
                  }}
                />
              ))}
              
              {/* Markers */}
              {cityPlaces.map(place => (
                <Marker
                  key={place.id}
                  position={[place.latitude, place.longitude]}
                  icon={getMarkerIcon(place.safety_score)}
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
                        <span className={`font-bold ${
                          getSafetyStatus(place.safety_score) === 'safe' ? 'text-green-600' :
                          getSafetyStatus(place.safety_score) === 'caution' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {place.safety_score}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{place.report_count} reports</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}

          {/* Selected place details */}
          {selectedPlace && (
            <Card className="absolute bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-[1000] shadow-xl">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedPlace.name}</CardTitle>
                    <p className="text-sm text-muted-foreground capitalize">{selectedPlace.type}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedPlace(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    {getSafetyStatus(selectedPlace.safety_score) === 'safe' && <Shield className="w-5 h-5 text-green-600" />}
                    {getSafetyStatus(selectedPlace.safety_score) === 'caution' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                    {getSafetyStatus(selectedPlace.safety_score) === 'danger' && <AlertCircle className="w-5 h-5 text-red-600" />}
                    <span className="text-2xl font-bold">{selectedPlace.safety_score}</span>
                  </div>
                  <Badge variant="secondary">{selectedPlace.report_count} reports</Badge>
                </div>
                <Link to={`/report?place=${selectedPlace.id}`}>
                  <Button className="w-full" size="sm">
                    Report Issue Here
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
