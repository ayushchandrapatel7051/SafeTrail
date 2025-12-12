import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Shield, MapPin, Camera, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { places as apiPlaces, reports as apiReports } from "@/lib/api";
import { reportTypes } from "@/data/mockData";
import DashboardLayout from "@/components/DashboardLayout";

const ReportForm = () => {
  const [searchParams] = useSearchParams();
  const preselectedPlace = searchParams.get('place');
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(true);
  const [places, setPlaces] = useState<any[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    placeId: preselectedPlace || "",
    type: "",
    description: "",
    latitude: "",
    longitude: "",
  });
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Load places on mount
  useEffect(() => {
    const loadPlaces = async () => {
      try {
        const data = await apiPlaces.getAll();
        console.log('Places data:', data);
        setPlaces(Array.isArray(data) ? data : data.data || []);
      } catch (error) {
        console.error('Error loading places:', error);
        // Use fallback empty array instead of showing error
        setPlaces([]);
      } finally {
        setIsLoadingPlaces(false);
      }
    };
    loadPlaces();
  }, [toast]);

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
    
    if (!formData.type || !formData.description || !formData.placeId || !formData.latitude || !formData.longitude) {
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
        place_id: parseInt(formData.placeId),
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
      
      setFormData({ placeId: "", type: "", description: "", latitude: "", longitude: "" });
      setPhotoFile(null);
      
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
      <div className="p-6 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Report Incident
          </h1>
          <p className="text-muted-foreground">Help other travelers by reporting safety incidents. All reports are anonymous and reviewed before publishing.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Submit Safety Report</CardTitle>
            <CardDescription>
              Help other travelers by reporting safety incidents. All reports are anonymous and reviewed before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Place Selection */}
              <div className="space-y-2">
                <Label htmlFor="place">Location / Place (Optional)</Label>
                <Select 
                  value={formData.placeId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, placeId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a known place or leave empty" />
                  </SelectTrigger>
                  <SelectContent>
                    {places.map(place => (
                      <SelectItem key={place.id} value={place.id.toString()}>
                        {place.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Incident Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Incident Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
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
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what happened. Include details like time of day, specific location, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              {/* Geolocation */}
              <div className="space-y-2">
                <Label htmlFor="location">GPS Coordinates (Required) *</Label>
                <div className="flex gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      id="latitude"
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                      type="number"
                      step="0.000001"
                    />
                    <Input
                      id="longitude"
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                      type="number"
                      step="0.000001"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGetLocation}
                    disabled={locationStatus === 'loading'}
                  >
                    {locationStatus === 'loading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {locationStatus === 'success' && (
                  <p className="text-xs text-green-600">Location captured successfully</p>
                )}
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <Label>Photo Evidence (Optional)</Label>
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('photo-input')?.click()}
                >
                  <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {photoFile ? photoFile.name : 'Click to upload or drag & drop'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 5MB
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

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Info card */}
        <Card className="mt-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2">How Reports Are Used</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Reports are reviewed by our moderation team</li>
              <li>• Verified reports affect place safety scores</li>
              <li>• Your identity is never shared publicly</li>
              <li>• False reports may result in account restrictions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportForm;
