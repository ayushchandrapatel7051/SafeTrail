import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Search,
  ChevronDown,
  MapPin,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSafetyStatus } from '@/data/mockData';
import { cities as citiesApi, places as placesApi } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import SOSButton from '@/components/SOSButton';

interface City {
  id: number;
  name: string;
  country: string;
  coordinates: [number, number];
  safetyScore: number;
  placesCount: number;
  reportsCount: number;
}

interface Place {
  id: number;
  name: string;
  cityId: number;
  coordinates: [number, number];
  safetyScore: number;
  reportCount: number;
  type: string;
}

const Dashboard = () => {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [safetyFilter, setSafetyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherCountries, setShowOtherCountries] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userCountry = useMemo(() => {
    return localStorage.getItem('userCountry') || 'India';
  }, []);

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      try {
        const [citiesData, placesData] = await Promise.all([
          citiesApi.getAll(),
          placesApi.getAll(),
        ]);

        const transformedCities = citiesData.map((city: Record<string, unknown>) => ({
          id: city.id as number,
          name: city.name as string,
          country: (city.country_name || city.country) as string,
          coordinates: [
            parseFloat(city.latitude as string),
            parseFloat(city.longitude as string),
          ] as [number, number],
          safetyScore: parseFloat(city.safety_score as string),
          placesCount: (city.places_count || 0) as number,
          reportsCount: (city.reports_count || 0) as number,
        }));

        const transformedPlaces = placesData.map((place: Record<string, unknown>) => ({
          id: place.id as number,
          name: place.name as string,
          cityId: place.city_id as number,
          coordinates: [
            parseFloat(place.latitude as string),
            parseFloat(place.longitude as string),
          ] as [number, number],
          safetyScore: parseFloat(place.safety_score as string),
          reportCount: (place.report_count || 0) as number,
          type: (place.type || place.category) as string,
        }));

        setCities(transformedCities);
        setPlaces(transformedPlaces);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const countryCities = useMemo(() => {
    return cities.filter((city) => city.country === userCountry);
  }, [cities, userCountry]);

  const otherCountriesCities = useMemo(() => {
    return cities.filter((city) => city.country !== userCountry);
  }, [cities, userCountry]);

  const currentCity = selectedCity ? cities.find((c) => c.id === selectedCity) : null;

  const filteredPlaces = places
    .filter((p) => !selectedCity || p.cityId === selectedCity)
    .filter((p) => {
      if (safetyFilter === 'all') return true;
      return getSafetyStatus(p.safetyScore) === safetyFilter;
    })
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusBadgeClass = (status: string) => {
    if (status === 'safe') return 'bg-safe text-safe-foreground';
    if (status === 'caution') return 'bg-caution text-caution-foreground';
    return 'bg-danger text-danger-foreground';
  };

  return (
    <DashboardLayout>
      {isLoading ? (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Hero Section */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-12 md:py-16">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold mb-3">Travel Safely</h1>
                  <p className="text-lg text-muted-foreground">
                    Explore <span className="font-semibold text-foreground">{userCountry}</span>{' '}
                    with confidence. Find safe places, report incidents, and plan your trips all in
                    one place.
                  </p>
                </div>
                <div>
                  <SOSButton size="lg" className="shadow-lg" />
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* View on Map Card */}
                <Link to="/map" className="group">
                  <div className="relative bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl overflow-hidden h-56 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                    {/* Icon at top */}
                    <div className="absolute top-6 right-6 text-white opacity-20">
                      <MapPin className="w-20 h-20" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Explore the Map</h3>
                        <p className="text-blue-50 mb-4">
                          Discover safe routes and places in your city
                        </p>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50 font-semibold">
                          <MapPin className="w-4 h-4 mr-2" />
                          View Map
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Report Incident Card */}
                <Link to="/report" className="group">
                  <div className="relative bg-gradient-to-br from-red-400 to-red-600 rounded-2xl overflow-hidden h-56 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                    {/* Icon at top */}
                    <div className="absolute top-6 right-6 text-white opacity-20">
                      <AlertCircle className="w-20 h-20" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Report an Incident</h3>
                        <p className="text-red-50 mb-4">Help others by reporting safety concerns</p>
                        <Button className="bg-white text-red-600 hover:bg-red-50 font-semibold">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Report Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Trip Planner Card */}
                <Link to="/trip-plan" className="group">
                  <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-2xl overflow-hidden h-56 shadow-lg hover:shadow-2xl transition-all duration-300">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
                    {/* Icon at top */}
                    <div className="absolute top-6 right-6 text-white opacity-20">
                      <Calendar className="w-20 h-20" />
                    </div>
                    <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                      <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Plan Your Trip</h3>
                        <p className="text-green-50 mb-4">Create safe travel itineraries</p>
                        <Button className="bg-white text-green-600 hover:bg-green-50 font-semibold">
                          <Calendar className="w-4 h-4 mr-2" />
                          Plan Trip
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-6">
            {/* City Stats */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Cities in {userCountry}</h2>
              {countryCities.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">No cities found for {userCountry}.</p>
                  <Button onClick={() => setShowOtherCountries(true)} variant="outline">
                    View Other Countries
                  </Button>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {countryCities.map((city) => {
                    const status = getSafetyStatus(city.safetyScore);
                    return (
                      <Card
                        key={city.id}
                        className={`cursor-pointer transition-all hover:shadow-lg ${selectedCity === city.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedCity(selectedCity === city.id ? null : city.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold">{city.name}</h3>
                            <Badge className={getStatusBadgeClass(status)}>
                              {city.safetyScore}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>{city.placesCount} places</span>
                            <span>{city.reportsCount} reports</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
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
                {currentCity ? `Places in ${currentCity.name}` : 'All Places'}
              </h2>
              <span className="text-sm text-muted-foreground">{filteredPlaces.length} places</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlaces.map((place) => {
                const status = getSafetyStatus(place.safetyScore);
                const trend =
                  place.reportCount < 5 ? 'up' : place.reportCount > 10 ? 'down' : 'stable';

                return (
                  <Card key={place.id} className="hover:shadow-lg transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{place.name}</CardTitle>
                          <CardDescription className="capitalize">{place.type}</CardDescription>
                        </div>
                        <Badge className={getStatusBadgeClass(status)}>{place.safetyScore}</Badge>
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
                          <span className="text-xs text-muted-foreground">
                            {place.reportCount} reports
                          </span>
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
                    {Array.from(new Set(otherCountriesCities.map((c) => c.country))).map(
                      (country) => (
                        <div key={country}>
                          <h2 className="text-xl font-semibold mb-4">{country}</h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {otherCountriesCities
                              .filter((c) => c.country === country)
                              .map((city) => {
                                const status = getSafetyStatus(city.safetyScore);
                                return (
                                  <Card
                                    key={city.id}
                                    className="cursor-pointer transition-all hover:shadow-lg"
                                    onClick={() =>
                                      setSelectedCity(selectedCity === city.id ? null : city.id)
                                    }
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-start justify-between mb-3">
                                        <h3 className="font-semibold">{city.name}</h3>
                                        <Badge className={getStatusBadgeClass(status)}>
                                          {city.safetyScore}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{city.placesCount} places</span>
                                        <span>{city.reportsCount} reports</span>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Dashboard;
