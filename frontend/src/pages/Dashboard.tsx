import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, TrendingUp, TrendingDown, Search, ChevronDown, MapPin, AlertCircle, Calendar, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { cities, places, getSafetyStatus } from "@/data/mockData";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const { toast } = useToast();
  const [safetyFilter, setSafetyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const userCountry = useMemo(() => {
    return localStorage.getItem('userCountry') || 'India';
  }, []);

  const countryCities = useMemo(() => {
    return cities.filter(city => city.country === userCountry);
  }, [userCountry]);

  const otherCountriesCities = useMemo(() => {
    return cities.filter(city => city.country !== userCountry);
  }, [userCountry]);
  const countries = useMemo(() => {
    const unique = Array.from(new Set(cities.map((city) => city.country)));
    return unique.sort();
  }, []);
  const citiesInCountry = useMemo(() => {
    if (!selectedCountry) return [];
    return cities.filter((city) => city.country === selectedCountry);
  }, [selectedCountry]);
  const placesInCity = useMemo(() => {
    if (!selectedCity) return [];
    return places.filter((place) => place.cityId === Number(selectedCity));
  }, [selectedCity]);
  const filteredPlaces = useMemo(() => {
    let filtered = selectedCity ? placesInCity : (selectedCountry ? places.filter(p => {
      const city = cities.find(c => c.id === p.cityId);
      return city?.country === selectedCountry;
    }) : places);
    filtered = filtered.filter(p => {
      if (safetyFilter === "all") return true;
      return getSafetyStatus(p.safetyScore) === safetyFilter;
    });
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (locationCoords) {
      const MAX_DISTANCE_KM = 5;
      filtered = filtered.filter(p => {
        let lat: number | undefined;
        let lng: number | undefined;
        if (Array.isArray(p.coordinates)) {
          lat = p.coordinates[0];
          lng = p.coordinates[1];
        } else if (p.coordinates && typeof p.coordinates === 'object') {
          lat = (p.coordinates as any).lat || (p.coordinates as any).latitude;
          lng = (p.coordinates as any).lng || (p.coordinates as any).longitude;
        } else {
          lat = (p as any).latitude;
          lng = (p as any).longitude;
        }

        if (lat === undefined || lng === undefined) {
          console.warn(`Place ${p.name} missing coordinates`);
          return false;
        }

        const distance = calculateDistance(
          locationCoords.latitude,
          locationCoords.longitude,
          lat,
          lng
        );
        return distance <= MAX_DISTANCE_KM;
      });
    }

    return filtered;
  }, [selectedCity, selectedCountry, placesInCity, safetyFilter, searchQuery, locationCoords]);

  const handleGetLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          setLocationStatus('success');
          toast({
            title: "Location Captured",
            description: `Showing places within 5km of your location.`,
          });
        },
        () => {
          setLocationStatus('error');
          toast({
            title: "Location Error",
            description: "Unable to get your location.",
            variant: "destructive",
          });
        }
      );
    } else {
      setLocationStatus('error');
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive",
      });
    }
  };

  const clearLocationFilter = () => {
    setLocationCoords(null);
    setLocationStatus('idle');
  };

  const getStatusBadgeClass = (status: string) => {
    if (status === 'safe') return 'bg-safe text-safe-foreground';
    if (status === 'caution') return 'bg-caution text-caution-foreground';
    return 'bg-danger text-danger-foreground';
  };

  return (
    <DashboardLayout>
      <div>
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-12 md:py-16">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">Travel Safely</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Explore <span className="font-semibold text-foreground">{userCountry}</span> with confidence. Find safe places, report incidents, and plan your trips all in one place. 
            </p>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* View on Map Card */}
              <Link to="/map" className="group">
                <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl overflow-hidden h-64 md:h-72 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                    <div></div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Explore the Map</h3>
                      <p className="text-blue-50 mb-4">Discover safe routes and places in your city</p>
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                        <MapPin className="w-4 h-4 mr-2" />
                        View Map
                      </Button>
                    </div>
                  </div>
                  {/* Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-blue-200 opacity-50">
                    <MapPin className="w-24 h-24" />
                  </div>
                </div>
              </Link>

              {/* Report Incident Card */}
              <Link to="/report" className="group">
                <div className="relative bg-gradient-to-br from-red-400 to-red-600 rounded-2xl overflow-hidden h-64 md:h-72 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                    <div></div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Report an Incident</h3>
                      <p className="text-red-50 mb-4">Help others by reporting safety concerns</p>
                      <Button className="bg-white text-red-600 hover:bg-red-50 font-semibold">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Report Now
                      </Button>
                    </div>
                  </div>
                  {/* Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-red-200 opacity-50">
                    <AlertCircle className="w-24 h-24" />
                  </div>
                </div>
              </Link>

              {/* Trip Planner Card */}
              <Link to="/trip-plan" className="group">
                <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-2xl overflow-hidden h-64 md:h-72 shadow-lg hover:shadow-2xl transition-all duration-300">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                  <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                    <div></div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2">Plan Your Trip</h3>
                      <p className="text-green-50 mb-4">Create safe travel itineraries</p>
                      <Button className="bg-white text-green-600 hover:bg-green-50 font-semibold">
                        <Calendar className="w-4 h-4 mr-2" />
                        Plan Trip
                      </Button>
                    </div>
                  </div>
                  {/* Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-green-200 opacity-50">
                    <Calendar className="w-24 h-24" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Location Selection */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Filter by Location</h2>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Primary filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Country */}
                    <div className="space-y-2">
                      <Label className="font-semibold">Country</Label>
                      <Select value={selectedCountry} onValueChange={(v) => {
                        setSelectedCountry(v);
                        setSelectedCity("");
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <Label className="font-semibold">City</Label>
                      <Select 
                        value={selectedCity} 
                        onValueChange={setSelectedCity}
                        disabled={!selectedCountry}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedCountry ? "Select city" : "Select country first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {citiesInCountry.map((city) => (
                            <SelectItem key={city.id} value={String(city.id)}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location-based filter */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={handleGetLocation}
                        disabled={locationStatus === 'loading'}
                        variant="outline"
                        className="flex-1"
                      >
                        {locationStatus === 'loading' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Use My Location
                          </>
                        )}
                      </Button>
                      {locationCoords && (
                        <Button 
                          onClick={clearLocationFilter}
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Clear Location
                        </Button>
                      )}
                    </div>
                    {locationStatus === 'success' && locationCoords && (
                      <Alert className="mt-3 bg-green-50 border-green-200">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          Showing places within 5km of your location
                        </AlertDescription>
                      </Alert>
                    )}
                    {locationStatus === 'error' && (
                      <Alert className="mt-3 bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          Unable to get your location. Please enable location access.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search places..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select value={safetyFilter} onValueChange={setSafetyFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by safety" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="safe">Safe (80+)</SelectItem>
                    <SelectItem value="caution">Caution (50-79)</SelectItem>
                    <SelectItem value="danger">Risky (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Places Grid */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {selectedCity ? `Places in ${citiesInCountry.find(c => c.id === Number(selectedCity))?.name}` : selectedCountry ? `Places in ${selectedCountry}` : 'All Places'}
            </h2>
            <span className="text-sm text-muted-foreground">{filteredPlaces.length} places</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPlaces.map(place => {
              const status = getSafetyStatus(place.safetyScore);
              const trend = place.reportCount < 5 ? 'up' : place.reportCount > 10 ? 'down' : 'stable';
              
              return (
                <Card key={place.id} className="hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{place.name}</CardTitle>
                        <CardDescription className="capitalize">{place.type}</CardDescription>
                      </div>
                      <Badge className={getStatusBadgeClass(status)}>
                        {place.safetyScore}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {status === 'safe' && <Shield className="w-5 h-5 text-safe" />}
                        {status === 'caution' && <Shield className="w-5 h-5 text-caution" />}
                        {status === 'danger' && <Shield className="w-5 h-5 text-danger" />}
                        <span className="text-sm text-muted-foreground capitalize">{status}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {trend === 'up' && <TrendingUp className="w-4 h-4 text-safe" />}
                        {trend === 'down' && <TrendingDown className="w-4 h-4 text-danger" />}
                        <span className="text-xs text-muted-foreground">{place.reportCount} reports</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link to={`/map?city=${place.cityId}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View on Map
                        </Button>
                      </Link>
                      <Link to={`/report?place=${place.id}`} className="flex-1">
                        <Button size="sm" className="w-full">
                          Report
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredPlaces.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No places found matching your criteria.</p>
            </div>
          )}

          {/* Other Countries Section */}
          {otherCountriesCities.length > 0 && (
            <div className="mt-12">
              <button
                onClick={() => setShowOtherCountries(!showOtherCountries)}
                className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-primary transition-colors"
              >
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${showOtherCountries ? 'rotate-180' : ''}`}
                />
                View Other Countries
              </button>

              {showOtherCountries && (
                <div className="space-y-6">
                  {Array.from(new Set(otherCountriesCities.map(c => c.country))).map(country => (
                    <div key={country}>
                      <h2 className="text-xl font-semibold mb-4">{country}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {otherCountriesCities.filter(c => c.country === country).map(city => {
                          const status = getSafetyStatus(city.safetyScore);
                          return (
                            <Card 
                              key={city.id}
                              className="cursor-pointer transition-all hover:shadow-lg"
                              onClick={() => {
                                setSelectedCountry(city.country);
                                setSelectedCity(String(city.id));
                              }}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <h3 className="font-semibold">{city.name}</h3>
                                  <Badge className={getStatusBadgeClass(status)}>
                                    {city.safetyScore}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                  <span>Places here</span>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default Dashboard;