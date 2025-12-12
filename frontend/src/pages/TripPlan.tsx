import { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  MapPin,
  Wallet,
  AlertCircle,
  Star,
  MapPinIcon,
  Calendar,
  Users,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';
import { cities, places } from '@/data/mockData';
import { citiesApi, attractionsApi } from '@/lib/api';

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

interface TripDay {
  id: string;
  day: number;
  activities: (typeof places)[number][];
  notes: string;
}

interface ItineraryItem {
  id: string;
  place: (typeof places)[number];
  timeSlot: string;
  notes: string;
}

interface Traveler {
  id: string;
  name: string;
  ageGroup: string;
  budget: number;
  priorities: string[];
}

export default function TripPlan() {
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [tripDuration, setTripDuration] = useState<number>(3);
  const [travelers, setTravelers] = useState<Traveler[]>([
    { id: '1', name: 'Traveler 1', ageGroup: '', budget: 0, priorities: [] },
  ]);
  const [tripGuide, setTripGuide] = useState<TripGuide | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [draggedPlace, setDraggedPlace] = useState<(typeof places)[number] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [editingTravelerIndex, setEditingTravelerIndex] = useState<number | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoadingAttractions, setIsLoadingAttractions] = useState(false);

  // Fetch attractions when city is selected
  useEffect(() => {
    const fetchAttractions = async () => {
      if (!selectedCity) {
        setAttractions([]);
        return;
      }

      setIsLoadingAttractions(true);
      try {
        const data = await attractionsApi.getByCityId(Number(selectedCity));
        setAttractions(data);
      } catch (error) {
        console.error('Failed to fetch attractions:', error);
        setAttractions([]);
      } finally {
        setIsLoadingAttractions(false);
      }
    };

    fetchAttractions();
  }, [selectedCity]);

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
    if (!selectedCity || totalBudget <= 0 || !cityDetails) return;

    const cityPlaces = places.filter((place) => place.cityId === Number(selectedCity));

    // Categorize places by safety
    const safePlaces = cityPlaces
      .filter((place) => place.safetyScore >= 75)
      .sort((a, b) => b.safetyScore - a.safetyScore)
      .slice(0, 8);

    // Use attractions from API instead of filtering places
    const greatPlaces = attractions
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 8)
      .map((attraction) => ({
        id: attraction.id,
        name: attraction.name,
        type: attraction.category?.toLowerCase() || 'tourist_spot',
        address: '',
        cityId: attraction.city_id,
        latitude: attraction.latitude,
        longitude: attraction.longitude,
        safetyScore: Math.round((attraction.rating || 4) * 20),
        reportCount: 0,
        description: attraction.description || '',
        imageUrl: attraction.image_url || '/placeholder.svg',
      }));

    // Generate safety tips based on city's safety score and traveler preferences
    const tips: string[] = [];
    const allPriorities = travelers.flatMap((t) => t.priorities || []);

    if (cityDetails.safetyScore >= 75) {
      tips.push(
        'This city is relatively safe. Still, avoid walking alone at night in unfamiliar areas.'
      );
      tips.push('Use registered taxis or ride-sharing apps for transportation.');
    } else if (cityDetails.safetyScore >= 50) {
      tips.push('Exercise caution, especially in certain neighborhoods.');
      tips.push('Avoid carrying large amounts of cash or valuable items.');
      tips.push('Stay aware of your surroundings, especially at night.');
    } else {
      tips.push('This area has some safety concerns. Stay with trusted locals when possible.');
      tips.push('Use official transportation and registered guides for tours.');
      tips.push('Avoid isolated areas, particularly after dark.');
    }

    // Add preference-based tips
    if (allPriorities.includes('Nightlife')) {
      tips.push('Research safe nightlife areas and avoid wandering alone at night.');
    }
    if (allPriorities.includes('Culture & History')) {
      tips.push('Visit museums and cultural sites during daytime for better experience.');
    }

    tips.push('Keep emergency numbers saved in your phone.');
    tips.push('Share your itinerary with friends or family.');

    const guide: TripGuide = {
      city: cityDetails.name,
      country: cityDetails.country,
      budget: totalBudget,
      safePlaces,
      greatPlaces,
      safetyRating: cityDetails.safetyScore,
      estimatedDailyBudget: Math.ceil(totalBudget / tripDuration),
      tips,
    };

    setTripGuide(guide);
    setItinerary([]);
    setSelectedDay(1);
  };

  const addTraveler = () => {
    const newTraveler: Traveler = {
      id: Date.now().toString(),
      name: `Traveler ${travelers.length + 1}`,
      ageGroup: '',
      budget: 0,
      priorities: [],
    };
    setTravelers([...travelers, newTraveler]);
  };

  const removeTraveler = (id: string) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((t) => t.id !== id));
    }
  };

  const updateTraveler = (id: string, updates: Partial<Traveler>) => {
    setTravelers(travelers.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const togglePriority = (travelerId: string, priority: string) => {
    setTravelers(
      travelers.map((t) => {
        if (t.id === travelerId) {
          const currentPriorities = t.priorities || [];
          const newPriorities = currentPriorities.includes(priority)
            ? currentPriorities.filter((p) => p !== priority)
            : [...currentPriorities, priority];
          return { ...t, priorities: newPriorities };
        }
        return t;
      })
    );
  };

  const totalBudget = useMemo(() => {
    return travelers.reduce((sum, t) => sum + (t.budget || 0), 0);
  }, [travelers]);

  const averageBudgetPerPerson = useMemo(() => {
    return travelers.length > 0 ? Math.ceil(totalBudget / travelers.length) : 0;
  }, [totalBudget, travelers.length]);

  const addPlaceToItinerary = (place: (typeof places)[number], day: number = selectedDay) => {
    const newItem: ItineraryItem = {
      id: `${place.id}-${Date.now()}`,
      place,
      timeSlot: 'Morning',
      notes: '',
    };
    setItinerary([...itinerary, { ...newItem }]);
  };

  const removePlaceFromItinerary = (id: string) => {
    setItinerary(itinerary.filter((item) => item.id !== id));
  };

  const updateItineraryItem = (id: string, updates: Partial<ItineraryItem>) => {
    setItinerary(itinerary.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleConfirmPlan = () => {
    setShowConfirmation(true);
  };

  const handleSavePlan = () => {
    // Here you would typically save the plan to the backend
    console.log('Plan saved:', { tripGuide, itinerary, tripDuration, travelers, totalBudget });
    setShowConfirmation(false);
    // Show success message
    alert('Trip plan saved successfully!');
  };

  const getSafetyColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSafetyBadge = (score: number) => {
    if (score >= 75) return 'Safe';
    if (score >= 50) return 'Moderate';
    return 'Caution';
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold mb-2">Trip Planner</h1>
          <p className="text-muted-foreground text-lg">
            Create a personalized and safe travel itinerary
          </p>
        </div>

        {!tripGuide ? (
          /* Initial Planning Form */
          <Card className="border-2 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-2xl">Plan Your Adventure</CardTitle>
              <CardDescription>
                Provide your trip details to get personalized recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Destination & Duration */}
                <div className="space-y-6">
                  {/* Country Selection */}
                  <div className="space-y-3">
                    <Label htmlFor="country" className="text-base font-semibold">
                      Country
                    </Label>
                    <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger id="country" className="h-11">
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
                  <div className="space-y-3">
                    <Label htmlFor="city" className="text-base font-semibold">
                      City
                    </Label>
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger id="city" disabled={!selectedCountry} className="h-11">
                        <SelectValue
                          placeholder={selectedCountry ? 'Select a city' : 'Select a country first'}
                        />
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

                  {/* Trip Duration */}
                  <div className="space-y-3">
                    <Label
                      htmlFor="duration"
                      className="text-base font-semibold flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Trip Duration (Days)
                    </Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="duration"
                        type="number"
                        value={tripDuration}
                        onChange={(e) => setTripDuration(Math.max(1, Number(e.target.value)))}
                        min="1"
                        max="30"
                        className="h-11"
                      />
                      <span className="text-sm text-muted-foreground">{tripDuration} days</span>
                    </div>
                  </div>
                </div>

                {/* Middle Column - Travelers */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Trip Companions
                      </Label>
                      <Button size="sm" variant="outline" onClick={addTraveler} className="h-8">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Traveler
                      </Button>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {travelers.map((traveler, index) => (
                        <Card key={traveler.id} className="border-blue-200 bg-blue-50/50">
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <Input
                                placeholder="Traveler name"
                                value={traveler.name}
                                onChange={(e) =>
                                  updateTraveler(traveler.id, { name: e.target.value })
                                }
                                className="text-sm h-9"
                              />
                              {travelers.length > 1 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeTraveler(traveler.id)}
                                  className="h-9 px-2 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>

                            {/* Age Group */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-700">
                                Age Group
                              </Label>
                              <Select
                                value={traveler.ageGroup}
                                onValueChange={(value) =>
                                  updateTraveler(traveler.id, { ageGroup: value })
                                }
                              >
                                <SelectTrigger className="h-9 text-xs">
                                  <SelectValue placeholder="Select age group" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="13-17">13-17 (Teen)</SelectItem>
                                  <SelectItem value="18-25">18-25 (Young Adult)</SelectItem>
                                  <SelectItem value="26-35">26-35 (Adult)</SelectItem>
                                  <SelectItem value="36-50">36-50 (Middle Age)</SelectItem>
                                  <SelectItem value="51+">51+ (Senior)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Budget */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-700">
                                Personal Budget (USD)
                              </Label>
                              <Input
                                type="number"
                                placeholder="e.g., 500"
                                value={traveler.budget || ''}
                                onChange={(e) =>
                                  updateTraveler(traveler.id, { budget: Number(e.target.value) })
                                }
                                className="h-9 text-xs"
                                min="0"
                              />
                            </div>

                            {/* Priorities */}
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-gray-700">
                                Preferences
                              </Label>
                              <div className="space-y-2">
                                {['Safety', 'Tourist Places', 'Nightlife', 'Culture & History'].map(
                                  (priority) => (
                                    <div key={priority} className="flex items-center gap-2">
                                      <Checkbox
                                        id={`${traveler.id}-${priority}`}
                                        checked={traveler.priorities?.includes(priority) || false}
                                        onCheckedChange={() =>
                                          togglePriority(traveler.id, priority)
                                        }
                                      />
                                      <label
                                        htmlFor={`${traveler.id}-${priority}`}
                                        className="text-xs cursor-pointer text-gray-700"
                                      >
                                        {priority}
                                      </label>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column - Budget Summary */}
                <div className="space-y-6">
                  {/* Total Budget Summary */}
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6 space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">Total Trip Budget</p>
                        <p className="text-3xl font-bold text-green-700">${totalBudget}</p>
                      </div>
                      <div className="border-t border-green-200 pt-4 space-y-3">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Per Person (Average)</p>
                          <p className="text-xl font-bold text-green-600">
                            ${averageBudgetPerPerson}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Per Day (Total)</p>
                          <p className="text-xl font-bold text-green-600">
                            ${Math.ceil(totalBudget / tripDuration)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Travelers Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Group Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Travelers:</p>
                        <p className="font-semibold">{travelers.length}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-2">Age Distribution:</p>
                        <div className="flex flex-wrap gap-1">
                          {travelers.map((t) => (
                            <Badge key={t.id} variant="secondary" className="text-xs">
                              {t.ageGroup || 'Not set'}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Button
                onClick={handleGenerateGuide}
                disabled={!selectedCity || totalBudget <= 0 || travelers.some((t) => !t.ageGroup)}
                className="w-full h-12 text-lg font-semibold mt-8"
              >
                Generate Personalized Guide
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Trip Planning Interface */
          <div className="space-y-6">
            {/* Back Button */}
            <Button onClick={() => setTripGuide(null)} variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Trip Planning
            </Button>

            {/* Trip Header */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
              <CardContent className="pt-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Destination</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <MapPin className="w-5 h-5" /> {tripGuide.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Budget</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Wallet className="w-5 h-5" /> ${totalBudget}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Travelers</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      <Users className="w-5 h-5" /> {travelers.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-100 text-sm mb-2">Safety Rating</p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-white text-blue-600 font-bold text-lg">
                        {tripGuide.safetyRating}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Content - Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Places */}
              <div className="lg:col-span-1 space-y-4">
                {/* Safe Places */}
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-4 h-4" /> Safe Places
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {tripGuide.safePlaces.map((place) => (
                      <div
                        key={place.id}
                        draggable
                        onDragStart={() => setDraggedPlace(place)}
                        className="p-3 bg-white border border-green-200 rounded-lg cursor-move hover:shadow-md transition hover:border-green-400"
                      >
                        <p className="font-semibold text-sm text-gray-900">{place.name}</p>
                        <p className="text-xs text-gray-500 capitalize mb-2">
                          {place.type.replace('_', ' ')}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {place.safetyScore}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => addPlaceToItinerary(place)}
                            className="h-6 px-2"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Great Places */}
                <Card className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-yellow-700">
                      <Star className="w-4 h-4" /> Attractions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                    {tripGuide.greatPlaces.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No attractions found for this city
                      </p>
                    ) : (
                      tripGuide.greatPlaces.map((place) => (
                        <div
                          key={place.id}
                          draggable
                          onDragStart={() => setDraggedPlace(place)}
                          className="p-3 bg-white border border-yellow-200 rounded-lg cursor-move hover:shadow-md transition hover:border-yellow-400"
                        >
                          <p className="font-semibold text-sm text-gray-900">{place.name}</p>
                          <p className="text-xs text-gray-500 capitalize mb-2">
                            {place.type.replace('_', ' ')}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                              {place.safetyScore}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addPlaceToItinerary(place)}
                              className="h-6 px-2"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Itinerary */}
              <div className="lg:col-span-2 space-y-4">
                {/* Safety Tips */}
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                      <AlertCircle className="w-4 h-4" /> Safety Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {tripGuide.tips.slice(0, 4).map((tip, index) => (
                        <li key={index} className="flex gap-2 text-sm">
                          <span className="text-blue-600 font-bold min-w-fit">✓</span>
                          <span className="text-gray-700">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Itinerary Builder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Build Your Itinerary</CardTitle>
                    <CardDescription>
                      Drag places from the left or click + to add. Remove items as needed.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {itinerary.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                        <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No activities added yet</p>
                        <p className="text-sm text-muted-foreground">
                          Add places to build your itinerary
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {itinerary.map((item) => (
                          <div
                            key={item.id}
                            className="p-4 border rounded-lg hover:bg-muted/50 transition bg-card"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">{item.place.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {item.place.type.replace('_', ' ')}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePlaceFromItinerary(item.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="flex gap-3">
                              <Select
                                value={item.timeSlot}
                                onValueChange={(value) =>
                                  updateItineraryItem(item.id, { timeSlot: value })
                                }
                              >
                                <SelectTrigger className="w-32 h-9 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Morning">Morning</SelectItem>
                                  <SelectItem value="Afternoon">Afternoon</SelectItem>
                                  <SelectItem value="Evening">Evening</SelectItem>
                                  <SelectItem value="Night">Night</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input
                                placeholder="Add notes..."
                                value={item.notes}
                                onChange={(e) =>
                                  updateItineraryItem(item.id, { notes: e.target.value })
                                }
                                className="h-9 text-xs flex-1"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                {itinerary.length > 0 && (
                  <div className="flex gap-3">
                    <Button onClick={() => setTripGuide(null)} variant="outline" className="flex-1">
                      Back to Planning
                    </Button>
                    <Button
                      onClick={handleConfirmPlan}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Review & Confirm Plan
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Confirm Your Trip Plan
              </DialogTitle>
              <DialogDescription>
                Review your itinerary before saving. You can edit it anytime.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Trip Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Trip Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-blue-700">Destination:</p>
                    <p className="font-semibold">
                      {tripGuide?.city}, {tripGuide?.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-700">Duration:</p>
                    <p className="font-semibold">{tripDuration} days</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Total Budget:</p>
                    <p className="font-semibold">${totalBudget}</p>
                  </div>
                  <div>
                    <p className="text-blue-700">Travelers:</p>
                    <p className="font-semibold">{travelers.length}</p>
                  </div>
                </div>
              </div>

              {/* Travelers Details */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Group Details
                </h3>
                <div className="space-y-3">
                  {travelers.map((traveler) => (
                    <div
                      key={traveler.id}
                      className="bg-gray-50 p-3 rounded border border-gray-200 text-sm"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-semibold">{traveler.name}</p>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          {traveler.ageGroup}
                        </Badge>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-gray-600">
                          Budget: <span className="font-semibold">${traveler.budget}</span>
                        </p>
                      </div>
                      {traveler.priorities && traveler.priorities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {traveler.priorities.map((priority) => (
                            <Badge
                              key={priority}
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-800"
                            >
                              {priority}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Itinerary Summary */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Activities ({itinerary.length})
                </h3>
                <div className="space-y-2">
                  {itinerary.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 text-sm">
                      <div className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold">
                        {item.place.safetyScore}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{item.place.name}</p>
                        <p className="text-xs text-muted-foreground">{item.timeSlot}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Reminder */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900 text-sm">Safety Reminder</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Always stay aware of your surroundings and follow local safety guidelines.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowConfirmation(false)}>
                Edit Plan
              </Button>
              <Button onClick={handleSavePlan} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Save Trip Plan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
