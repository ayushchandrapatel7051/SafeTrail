import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, MapPin, ArrowLeft, Hospital, Shield, Navigation } from 'lucide-react';
import { emergencyApi } from '@/lib/api';

interface Hospital {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface EmergencyData {
  id: number;
  name: string;
  type: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  city_name?: string;
  hospitals: Hospital[];
}

export default function EmergencyDetail() {
  const { placeId } = useParams<{ placeId: string }>();
  const navigate = useNavigate();
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadEmergencyDetail = async () => {
    if (!placeId) return;

    setIsLoading(true);
    try {
      const data = await emergencyApi.getByPlace(Number(placeId));
      setEmergencyData(data);
    } catch (error) {
      console.error('Failed to load emergency details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencyDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading emergency details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!emergencyData) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Emergency data not found.</p>
              <Button onClick={() => navigate('/emergency')} className="mt-4">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const mapCenter = {
    lat: parseFloat(emergencyData.place_lat),
    lng: parseFloat(emergencyData.place_lon),
  };

  const openInMaps = (lat: number, lng: number, name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={() => navigate('/emergency')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Emergency Contacts
          </Button>

          {/* Location Header */}
          <div>
            <h1 className="text-3xl font-bold">{emergencyData.place_name}</h1>
            <p className="text-muted-foreground mt-1">{emergencyData.city_name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Emergency Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Hotlines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {emergencyData.police_number && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="font-semibold">Police</p>
                        <p className="text-sm text-muted-foreground">24/7 Emergency</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${emergencyData.police_number}`}
                      className="text-2xl font-bold text-blue-600 hover:underline"
                    >
                      {emergencyData.police_number}
                    </a>
                  </div>
                )}

                {emergencyData.ambulance_number && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Hospital className="w-6 h-6 text-red-600" />
                      <div>
                        <p className="font-semibold">Ambulance</p>
                        <p className="text-sm text-muted-foreground">Medical Emergency</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${emergencyData.ambulance_number}`}
                      className="text-2xl font-bold text-red-600 hover:underline"
                    >
                      {emergencyData.ambulance_number}
                    </a>
                  </div>
                )}

                {emergencyData.fire_number && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-6 h-6 text-orange-600" />
                      <div>
                        <p className="font-semibold">Fire Brigade</p>
                        <p className="text-sm text-muted-foreground">Fire Emergency</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${emergencyData.fire_number}`}
                      className="text-2xl font-bold text-orange-600 hover:underline"
                    >
                      {emergencyData.fire_number}
                    </a>
                  </div>
                )}

                {emergencyData.women_helpline && (
                  <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-6 h-6 text-pink-600" />
                      <div>
                        <p className="font-semibold">Women Helpline</p>
                        <p className="text-sm text-muted-foreground">24/7 Support</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${emergencyData.women_helpline}`}
                      className="text-2xl font-bold text-pink-600 hover:underline"
                    >
                      {emergencyData.women_helpline}
                    </a>
                  </div>
                )}

                {emergencyData.tourist_helpline && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Phone className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-semibold">Tourist Helpline</p>
                        <p className="text-sm text-muted-foreground">Travel Assistance</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${emergencyData.tourist_helpline}`}
                      className="text-2xl font-bold text-purple-600 hover:underline"
                    >
                      {emergencyData.tourist_helpline}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nearest Police Station */}
            {emergencyData.nearest_police_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Nearest Police Station
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-lg">{emergencyData.nearest_police_name}</p>
                      <p className="text-muted-foreground flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4" />
                        {Math.round(emergencyData.nearest_police_distance_m)}m away
                      </p>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        openInMaps(
                          emergencyData.nearest_police_lat,
                          emergencyData.nearest_police_lon,
                          emergencyData.nearest_police_name
                        )
                      }
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Open in Maps
                    </Button>

                    {/* Embedded Map */}
                    <div className="rounded-lg overflow-hidden border">
                      <iframe
                        width="100%"
                        height="300"
                        frameBorder="0"
                        style={{ border: 0 } as React.CSSProperties}
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${emergencyData.nearest_police_lat},${emergencyData.nearest_police_lon}&zoom=15`}
                        allowFullScreen
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Nearby Hospitals */}
          {emergencyData.hospitals && emergencyData.hospitals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hospital className="w-5 h-5" />
                  Nearby Hospitals ({emergencyData.hospitals.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emergencyData.hospitals.map((hospital: Hospital) => (
                    <div
                      key={hospital.id}
                      className="border rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold">{hospital.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(hospital.distance_m)}m
                            </Badge>
                          </div>
                        </div>
                        <Hospital className="w-5 h-5 text-red-500" />
                      </div>

                      {hospital.address && (
                        <p className="text-xs text-muted-foreground mb-2">{hospital.address}</p>
                      )}

                      {hospital.phone && (
                        <a
                          href={`tel:${hospital.phone}`}
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-2"
                        >
                          <Phone className="w-3 h-3" />
                          {hospital.phone}
                        </a>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() =>
                          openInMaps(hospital.latitude, hospital.longitude, hospital.name)
                        }
                      >
                        <Navigation className="w-3 h-3 mr-1" />
                        Directions
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Combined Map showing all hospitals */}
                <div className="mt-6 rounded-lg overflow-hidden border">
                  <iframe
                    width="100%"
                    height="400"
                    frameBorder="0"
                    style={{ border: 0 }}
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=hospitals+near+${mapCenter.lat},${mapCenter.lng}&zoom=14`}
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
