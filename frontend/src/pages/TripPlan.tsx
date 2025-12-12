import { useState, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Wallet, AlertCircle, Star, MapPinIcon } from "lucide-react";
import { cities, places } from "@/data/mockData";

interface TripGuide {
  city: string;
  country: string;
  budget: number;
  safePlaces: (typeof places)[number][];
  greatPlaces: (typeof places)[number][];
  safetyRating: number;
  estimatedDailyBudget: number;
  tips: string[];
}

export default function TripPlan() {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [budget, setBudget] = useState<number>(0);
  const [tripGuide, setTripGuide] = useState<TripGuide | null>(null);

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

  // Get selected city details
  const cityDetails = useMemo(() => {
    return cities.find((city) => city.id === Number(selectedCity));
  }, [selectedCity]);

  // Generate trip guide
  const handleGenerateGuide = () => {
    if (!selectedCity || budget <= 0 || !cityDetails) return;

    const cityPlaces = places.filter((place) => place.cityId === Number(selectedCity));

    // Categorize places by safety
    const safePlaces = cityPlaces
      .filter((place) => place.safetyScore >= 75)
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 5);

    const greatPlaces = cityPlaces
      .filter((place) => place.type === "tourist_spot" || place.type === "restaurant")
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 5);

    // Generate safety tips based on city's safety score
    const tips: string[] = [];
    if (cityDetails.safetyScore >= 75) {
      tips.push("This city is relatively safe. Still, avoid walking alone at night in unfamiliar areas.");
      tips.push("Use registered taxis or ride-sharing apps for transportation.");
    } else if (cityDetails.safetyScore >= 50) {
      tips.push("Exercise caution, especially in certain neighborhoods.");
      tips.push("Avoid carrying large amounts of cash or valuable items.");
      tips.push("Stay aware of your surroundings, especially at night.");
    } else {
      tips.push("This area has some safety concerns. Stay with trusted locals when possible.");
      tips.push("Use official transportation and registered guides for tours.");
      tips.push("Avoid isolated areas, particularly after dark.");
    }
    tips.push("Keep emergency numbers saved in your phone.");

    const guide: TripGuide = {
      city: cityDetails.name,
      country: cityDetails.country,
      budget,
      safePlaces,
      greatPlaces,
      safetyRating: cityDetails.safetyScore,
      estimatedDailyBudget: Math.ceil(budget / 3),
      tips,
    };

    setTripGuide(guide);
  };

  const getSafetyColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 75) return "Safe";
    if (score >= 50) return "Moderate";
    return "Caution";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Trip Planner</h1>
          <p className="text-muted-foreground">Plan your safe and great travel experience</p>
        </div>

        {/* Trip Planning Form */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Your Trip</CardTitle>
            <CardDescription>Select your destination and budget to get personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Select a country" />
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

              {/* City Selection */}
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger id="city" disabled={!selectedCountry}>
                    <SelectValue placeholder={selectedCountry ? "Select a city" : "Select a country first"} />
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

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget">Total Budget (USD)</Label>
                <Input
                  id="budget"
                  type="number"
                  placeholder="e.g., 1000"
                  value={budget || ""}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  min="0"
                />
              </div>
            </div>

            <Button onClick={handleGenerateGuide} disabled={!selectedCity || budget <= 0} className="w-full">
              Generate Trip Guide
            </Button>
          </CardContent>
        </Card>

        {/* Trip Guide Results */}
        {tripGuide && (
          <div className="space-y-6">
            {/* Trip Summary */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <MapPin className="w-6 h-6" />
                      {tripGuide.city}, {tripGuide.country}
                    </CardTitle>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-sm font-medium">Safety Rating</span>
                      <Badge className={`text-lg ${getSafetyColor(tripGuide.safetyRating)}`} variant="outline">
                        {tripGuide.safetyRating}
                      </Badge>
                    </div>
                    <p className={`text-sm font-semibold ${getSafetyColor(tripGuide.safetyRating)}`}>
                      {getSafetyBadge(tripGuide.safetyRating)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold flex items-center gap-1">
                    <Wallet className="w-5 h-5" />
                    ${tripGuide.budget}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Budget</p>
                  <p className="text-2xl font-bold">${tripGuide.estimatedDailyBudget}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-2xl font-bold">3 Days</p>
                </div>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Safety Tips for {tripGuide.city}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tripGuide.tips.map((tip, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="text-primary font-bold min-w-fit">•</span>
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Safe Places */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-green-600" />
                  Safest Places to Visit
                </CardTitle>
                <CardDescription>High-safety locations recommended for your visit</CardDescription>
              </CardHeader>
              <CardContent>
                {tripGuide.safePlaces.length > 0 ? (
                  <div className="space-y-3">
                    {tripGuide.safePlaces.map((place) => (
                      <div key={place.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{place.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{place.type.replace("_", " ")}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">{place.safetyScore}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Reports: {place.reportCount} | Verified safe location</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No highly safe places found in this city.</p>
                )}
              </CardContent>
            </Card>

            {/* Great Places */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-600" />
                  Great Places & Attractions
                </CardTitle>
                <CardDescription>Popular restaurants and tourist attractions</CardDescription>
              </CardHeader>
              <CardContent>
                {tripGuide.greatPlaces.length > 0 ? (
                  <div className="space-y-3">
                    {tripGuide.greatPlaces.map((place) => (
                      <div key={place.id} className="border rounded-lg p-4 hover:bg-muted/50 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{place.name}</p>
                            <p className="text-sm text-muted-foreground capitalize">{place.type.replace("_", " ")}</p>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800">{place.safetyScore}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Reports: {place.reportCount} | Popular destination</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No great places found in this city.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
