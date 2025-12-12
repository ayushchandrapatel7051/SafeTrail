import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Phone, MapPin, Search, ExternalLink, Hospital, Shield } from 'lucide-react';
import { cities as citiesApi, emergencyApi } from '@/lib/api';

export default function Emergency() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emergencyServices, setEmergencyServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      loadEmergencyServices(Number(selectedCity));
    }
  }, [selectedCity]);

  const loadCities = async () => {
    try {
      const data = await citiesApi.getAll();
      setCities(data);
      if (data.length > 0) {
        setSelectedCity(data[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadEmergencyServices = async (cityId: number) => {
    setIsLoading(true);
    setEmergencyServices([]); // Clear previous data
    setSearchQuery(''); // Clear search query
    try {
      const data = await emergencyApi.getByCity(cityId);
      setEmergencyServices(data);
    } catch (error) {
      console.error('Failed to load emergency services:', error);
      setEmergencyServices([]); // Clear on error too
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      if (selectedCity) {
        loadEmergencyServices(Number(selectedCity));
      }
      return;
    }

    setIsLoading(true);
    try {
      const cityName = cities.find((c) => c.id === Number(selectedCity))?.name || '';
      const data = await emergencyApi.search({
        city: cityName,
        place: searchQuery,
      });
      setEmergencyServices(data);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const viewDetails = (placeId: number) => {
    navigate(`/emergency/${placeId}`);
  };

  const filteredServices = searchQuery
    ? emergencyServices.filter((service) =>
        service.place_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emergencyServices;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Emergency Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Quick access to emergency services and nearby hospitals
            </p>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">City</label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
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

                <div>
                  <label className="text-sm font-medium mb-2 block">Search Location</label>
                  <Input
                    placeholder="Search by place name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>

                <div className="flex items-end">
                  <Button onClick={handleSearch} className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Services List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading emergency services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground">
                  No emergency services found for this location.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <Card key={service.place_id} className="hover:shadow-lg transition">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      {service.place_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{service.city_name}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Emergency Numbers */}
                    <div className="space-y-2">
                      {service.police_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">Police:</span>
                          <a
                            href={`tel:${service.police_number}`}
                            className="text-blue-600 hover:underline"
                          >
                            {service.police_number}
                          </a>
                        </div>
                      )}
                      {service.ambulance_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hospital className="w-4 h-4 text-red-600" />
                          <span className="font-medium">Ambulance:</span>
                          <a
                            href={`tel:${service.ambulance_number}`}
                            className="text-blue-600 hover:underline"
                          >
                            {service.ambulance_number}
                          </a>
                        </div>
                      )}
                      {service.fire_number && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">Fire:</span>
                          <a
                            href={`tel:${service.fire_number}`}
                            className="text-blue-600 hover:underline"
                          >
                            {service.fire_number}
                          </a>
                        </div>
                      )}
                      {service.women_helpline && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-pink-600" />
                          <span className="font-medium">Women Helpline:</span>
                          <a
                            href={`tel:${service.women_helpline}`}
                            className="text-blue-600 hover:underline"
                          >
                            {service.women_helpline}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Nearest Police */}
                    {service.nearest_police_name && (
                      <div className="pt-2 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Nearest Police Station
                        </p>
                        <p className="text-sm">{service.nearest_police_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.round(service.nearest_police_distance_m)}m away
                        </p>
                      </div>
                    )}

                    {/* More Details Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => viewDetails(service.place_id)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Full Details & Map
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
