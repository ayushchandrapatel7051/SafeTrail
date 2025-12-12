import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Shield, TrendingUp, TrendingDown, Search, ChevronDown } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cities, places, getSafetyStatus } from "@/data/mockData";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [safetyFilter, setSafetyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherCountries, setShowOtherCountries] = useState(false);

  const userCountry = useMemo(() => {
    return localStorage.getItem('userCountry') || 'India';
  }, []);

  const countryCities = useMemo(() => {
    return cities.filter(city => city.country === userCountry);
  }, [userCountry]);

  const otherCountriesCities = useMemo(() => {
    return cities.filter(city => city.country !== userCountry);
  }, [userCountry]);

  const currentCity = selectedCity ? cities.find(c => c.id === selectedCity) : null;
  
  const filteredPlaces = places
    .filter(p => !selectedCity || p.cityId === selectedCity)
    .filter(p => {
      if (safetyFilter === "all") return true;
      return getSafetyStatus(p.safetyScore) === safetyFilter;
    })
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStatusBadgeClass = (status: string) => {
    if (status === 'safe') return 'bg-safe text-safe-foreground';
    if (status === 'caution') return 'bg-caution text-caution-foreground';
    return 'bg-danger text-danger-foreground';
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">You're viewing safety information for <span className="font-semibold text-foreground">{userCountry}</span></p>
        </div>
        {/* City Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {countryCities.map(city => {
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
