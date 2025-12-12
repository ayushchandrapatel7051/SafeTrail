import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Shield, MapPin, Camera, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { places as apiPlaces, reports as apiReports, cities as apiCities } from "@/lib/api";
import { reportTypes, cities, places } from "@/data/mockData";
import DashboardLayout from "@/components/DashboardLayout";

interface CityData {
  id: number;
  name: string;
  country: string;
  safetyScore: number;
}

interface PlaceData {
  id: number;
  name: string;
  cityId: number;
  safetyScore: number;
  type: string;
}

const ReportForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const preselectedPlace = searchParams.get('place');
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Location selection states
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedPlace, setSelectedPlace] = useState<string>(preselectedPlace || "");
  
  const [formData, setFormData] = useState({
    type: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Get unique countries
  const countries = useMemo(() => {
    const unique = Array.from(new Set(cities.map((city) => city.country)));
    return unique.sort();
  }, []);

  // Filter cities by selected country
  const citiesInCountry = useMemo(() => {
    if (!selectedCountry) return [];
    return cities.filter((city) => city.country === selectedCountry);
  }, [selectedCountry]);

  // Filter places by selected city
  const placesInCity = useMemo(() => {
    if (!selectedCity) return [];
    return places.filter((place) => place.cityId === Number(selectedCity));
  }, [selectedCity]);

  const handleGetLocation = () => {
    setLocationStatus('loading');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
          }));
          setLocationStatus('success');
        },
        () => {
          setLocationStatus('error');
          toast({
            title: "Location Error",
            description: "Unable to get your location. Please enter manually.",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.description || !selectedPlace || !formData.latitude || !formData.longitude) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiReports.create({
        place_id: parseInt(selectedPlace),
        type: formData.type,
        description: formData.description,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        photo: photoFile || undefined,
      });
      
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep travelers safe. Your report is under review.",
      });
      
      setFormData({ type: "", description: "", latitude: "", longitude: "" });
      setPhotoFile(null);
      setSelectedCountry("");
      setSelectedCity("");
      setSelectedPlace("");
      
      // Redirect to map
      setTimeout(() => navigate('/map'), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit report",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-8 h-8 text-red-600" />
            <h1 className="text-4xl font-bold">Report Safety Incident</h1>
          </div>
          <p className="text-muted-foreground text-lg">Help protect the travel community by reporting safety concerns</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Info Card */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-blue-900">
                  <Shield className="w-4 h-4" />
                  Your Safety Matters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Completely Anonymous</p>
                  <p className="text-blue-800">Your identity is never shared or disclosed.</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Reviewed Carefully</p>
                  <p className="text-blue-800">Our team verifies all reports before publishing.</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-900 mb-1">Helps Everyone</p>
                  <p className="text-blue-800">Reports improve safety scores for places.</p>
                </div>
              </CardContent>
            </Card>

            {/* Guidelines Card */}
            <Card className="bg-amber-50 border-amber-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-900">
                  <AlertCircle className="w-4 h-4" />
                  Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-amber-900">
                <p>✓ Be specific and factual</p>
                <p>✓ Include relevant details and time</p>
                <p>✓ Add location coordinates</p>
                <p>✓ Evidence helps verification</p>
                <p>✗ No false reports</p>
                <p>✗ No personal attacks</p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                <CardTitle>Submit Incident Report</CardTitle>
                <CardDescription>
                  Provide location and incident details. All information is kept confidential.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Step 1: Location Selection */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      Step 1: Select Location
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Country */}
                      <div className="space-y-2">
                        <Label htmlFor="country" className="font-semibold">Country *</Label>
                        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                          <SelectTrigger id="country" className="h-11">
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
                        <Label htmlFor="city" className="font-semibold">City *</Label>
                        <Select 
                          value={selectedCity} 
                          onValueChange={setSelectedCity}
                          disabled={!selectedCountry}
                        >
                          <SelectTrigger id="city" className="h-11">
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

                      {/* Place */}
                      <div className="space-y-2">
                        <Label htmlFor="place" className="font-semibold">Specific Place *</Label>
                        <Select 
                          value={selectedPlace} 
                          onValueChange={setSelectedPlace}
                          disabled={!selectedCity}
                        >
                          <SelectTrigger id="place" className="h-11">
                            <SelectValue placeholder={selectedCity ? "Select place" : "Select city first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {placesInCity.map((place) => (
                              <SelectItem key={place.id} value={String(place.id)}>
                                {place.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Step 2: Incident Details */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Step 2: Incident Details
                    </h3>

                    {/* Incident Type */}
                    <div className="space-y-2 mb-4">
                      <Label htmlFor="type" className="font-semibold">Type of Incident *</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger id="type" className="h-11">
                          <SelectValue placeholder="Select incident type" />
                        </SelectTrigger>
                        <SelectContent>
                          {reportTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description" className="font-semibold">Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe what happened. Include details like:
- When did it happen? (time of day)
- What exactly happened?
- Who was involved?
- Any witnesses?
- What was the outcome?"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        className="resize-none"
                      />
                      <p className="text-xs text-muted-foreground">Minimum 20 characters recommended</p>
                    </div>
                  </div>

                  {/* Step 3: Location Coordinates */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-600" />
                      Step 3: GPS Coordinates
                    </h3>

                    <div className="bg-gray-50 border rounded-lg p-4 space-y-3">
                      <Button 
                        type="button" 
                        onClick={handleGetLocation}
                        disabled={locationStatus === 'loading'}
                        className="w-full h-11 font-semibold"
                        variant="outline"
                      >
                        {locationStatus === 'loading' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Use Current Location
                          </>
                        )}
                      </Button>

                      <div className="text-center text-xs text-muted-foreground">
                        Or enter manually:
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="latitude" className="text-sm">Latitude *</Label>
                          <Input
                            id="latitude"
                            placeholder="e.g., 40.7128"
                            value={formData.latitude}
                            onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                            type="number"
                            step="0.000001"
                            className="h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="longitude" className="text-sm">Longitude *</Label>
                          <Input
                            id="longitude"
                            placeholder="e.g., -74.0060"
                            value={formData.longitude}
                            onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                            type="number"
                            step="0.000001"
                            className="h-10"
                          />
                        </div>
                      </div>

                      {locationStatus === 'success' && (
                        <Alert className="bg-green-50 border-green-200">
                          <AlertCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">
                            Location captured successfully at {formData.latitude}, {formData.longitude}
                          </AlertDescription>
                        </Alert>
                      )}
                      {locationStatus === 'error' && (
                        <Alert className="bg-red-50 border-red-200">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            Unable to get location. Please enter coordinates manually.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>

                  {/* Step 4: Photo Upload */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Camera className="w-5 h-5 text-red-600" />
                      Step 4: Photo Evidence (Optional)
                    </h3>

                    <div 
                      className="border-3 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 hover:bg-red-50/30 transition-all cursor-pointer"
                      onClick={() => document.getElementById('photo-input')?.click()}
                    >
                      <Camera className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                      <p className="text-sm font-semibold text-gray-900 mb-1">
                        {photoFile ? photoFile.name : 'Click to upload or drag & drop'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 5MB (optional but recommended)
                      </p>
                      <input
                        id="photo-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setPhotoFile(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-base font-semibold bg-red-600 hover:bg-red-700"
                      disabled={isSubmitting || !selectedPlace || !formData.type || !formData.description || !formData.latitude || !formData.longitude}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Submitting Report...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Submit Report
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Your report is completely anonymous and will be reviewed within 24 hours.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ReportForm;
