import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  MapPin,
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Eye,
  Edit,
  Clock,
  Sun,
  Sunset,
  Moon,
  Heart,
  Building2,
  Music,
  Landmark,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface City {
  id: number;
  name: string;
  country: string;
}

interface Attraction {
  id: number;
  name: string;
  category: string;
  rating: number;
  estimated_duration: number;
}

interface ItineraryItem {
  id: string;
  type: 'place' | 'attraction';
  place_id?: number;
  attraction_id?: number;
  name: string;
  day_number: number;
  time_slot: string;
  start_time?: string;
  notes: string;
  order_index: number;
  category?: string;
}

interface TripPlan {
  id?: number;
  name: string;
  city_id: number;
  start_date: string;
  end_date: string;
  preferences: string[];
  notes: string;
  items: ItineraryItem[];
}

interface Traveler {
  id: string;
  name: string;
  ageGroup: string;
  budget: number;
}

const TIME_SLOTS = [
  { value: 'morning', label: 'Morning', icon: Sun },
  { value: 'afternoon', label: 'Afternoon', icon: Sun },
  { value: 'evening', label: 'Evening', icon: Sunset },
  { value: 'night', label: 'Night', icon: Moon },
];

const PREFERENCES = [
  { value: 'safety', label: 'Safety First', icon: Heart },
  { value: 'tourist', label: 'Tourist Places', icon: Building2 },
  { value: 'nightlife', label: 'Nightlife', icon: Music },
  { value: 'culture', label: 'Culture & History', icon: Landmark },
];

// Sortable Item Component
function SortableItem({
  item,
  onEdit,
  onDelete,
}: {
  item: ItineraryItem;
  onEdit: (item: ItineraryItem) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const timeSlot = TIME_SLOTS.find((t) => t.value === item.time_slot);
  const TimeIcon = timeSlot?.icon || Clock;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:shadow-md transition"
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="font-medium truncate">{item.name}</p>
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TimeIcon className="w-3 h-3" />
            {timeSlot?.label}
          </span>
          {item.start_time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.start_time}
            </span>
          )}
        </div>
        {item.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{item.notes}</p>}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  );
}

export default function TripPlanPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('create');

  // Form state
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [tripName, setTripName] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [preferences, setPreferences] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [travelers, setTravelers] = useState<Traveler[]>([
    { id: '1', name: '', ageGroup: '', budget: 0 },
  ]);

  // Itinerary state
  const [currentDay, setCurrentDay] = useState(1);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [places, setPlaces] = useState<Attraction[]>([]);

  // Saved plans
  const [savedPlans, setSavedPlans] = useState<TripPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit dialog
  const [editItem, setEditItem] = useState<ItineraryItem | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  // View plan dialog
  const [viewPlan, setViewPlan] = useState<
    (TripPlan & { travelers: Traveler[]; items: ItineraryItem[] }) | null
  >(null);
  const [showViewDialog, setShowViewDialog] = useState(false);

  // Drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadCities();
    if (activeTab === 'plans') {
      loadSavedPlans();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedCity) {
      loadCityData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity, preferences]);

  const loadCities = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/cities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setCities(data);
    } catch (error) {
      console.error('Failed to load cities:', error);
    }
  };

  const loadCityData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      // Load attractions
      const attractionsRes = await fetch(`${API_BASE_URL}/attractions/city/${selectedCity}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let attractionsData = await attractionsRes.json();

      // Load places
      const placesRes = await fetch(`${API_BASE_URL}/places/city/${selectedCity}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      let placesData = await placesRes.json();

      // Filter by preferences if any selected
      if (preferences.length > 0) {
        const filteredAttractions = attractionsData.filter(
          (a: Attraction) =>
            preferences.includes(a.category) ||
            (preferences.includes('tourist') &&
              ['tourist', 'Religious Site', 'Monument', 'Nature'].includes(a.category))
        );
        const filteredPlaces = placesData.filter(
          (p: Attraction) =>
            preferences.includes(p.category) ||
            (preferences.includes('tourist') && ['tourist'].includes(p.category))
        );

        // If filtering results in no matches, show all places
        if (filteredAttractions.length > 0 || filteredPlaces.length > 0) {
          attractionsData = filteredAttractions;
          placesData = filteredPlaces;
        }
      }

      setAttractions(attractionsData);
      setPlaces(placesData);
    } catch (error) {
      console.error('Failed to load city data:', error);
    }
  };

  const loadSavedPlans = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/trip-plans`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setSavedPlans(data);
    } catch (error) {
      console.error('Failed to load saved plans:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  };

  const addToItinerary = (item: Attraction, type: 'attraction' | 'place') => {
    const newItem: ItineraryItem = {
      id: `${type}-${item.id}-${Date.now()}`,
      type: type,
      [type === 'attraction' ? 'attraction_id' : 'place_id']: item.id,
      name: item.name,
      day_number: currentDay,
      time_slot: 'morning',
      start_time: '',
      notes: '',
      order_index: itinerary.filter((i) => i.day_number === currentDay).length,
      category: item.category,
    };
    setItinerary([...itinerary, newItem]);
  };

  const handleDragEnd = (event: { active: { id: string }; over: { id: string } }) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setItinerary((items) => {
        const dayItems = items.filter((i) => i.day_number === currentDay);
        const otherItems = items.filter((i) => i.day_number !== currentDay);

        const oldIndex = dayItems.findIndex((i) => i.id === active.id);
        const newIndex = dayItems.findIndex((i) => i.id === over.id);

        const reordered = arrayMove(dayItems, oldIndex, newIndex).map((item, idx) => ({
          ...item,
          order_index: idx,
        }));

        return [...otherItems, ...reordered].sort((a, b) => {
          if (a.day_number !== b.day_number) return a.day_number - b.day_number;
          return a.order_index - b.order_index;
        });
      });
    }
  };

  const saveTripPlan = async () => {
    if (!tripName || !selectedCity || !startDate || !endDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
        name: tripName,
        city_id: parseInt(selectedCity),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        preferences,
        notes,
        travelers,
        items: itinerary,
      };

      const res = await fetch(`${API_BASE_URL}/trip-plans`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Trip plan saved successfully!');
        setActiveTab('plans');
        loadSavedPlans();
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save trip plan:', error);
      alert('Failed to save trip plan');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (id: string) => {
    setItinerary(itinerary.filter((item) => item.id !== id));
  };

  const saveEditedItem = () => {
    if (!editItem) return;

    setItinerary(itinerary.map((item) => (item.id === editItem.id ? editItem : item)));
    setShowEditDialog(false);
    setEditItem(null);
  };

  const addTraveler = () => {
    setTravelers([
      ...travelers,
      {
        id: Date.now().toString(),
        name: '',
        ageGroup: '',
        budget: 0,
      },
    ]);
  };

  const removeTraveler = (id: string) => {
    if (travelers.length > 1) {
      setTravelers(travelers.filter((t) => t.id !== id));
    }
  };

  const updateTraveler = (id: string, field: keyof Traveler, value: string | number) => {
    setTravelers(travelers.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleViewPlan = async (planId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/trip-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setViewPlan(data);
      setShowViewDialog(true);
    } catch (error) {
      console.error('Failed to load plan details:', error);
      alert('Failed to load plan details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = async (planId: number) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/trip-plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      // Load plan data into form
      setTripName(data.name);
      setSelectedCity(data.city_id.toString());
      setStartDate(new Date(data.start_date));
      setEndDate(new Date(data.end_date));
      setPreferences(data.preferences || []);
      setNotes(data.notes || '');

      // Load travelers
      if (data.travelers && Array.isArray(data.travelers) && data.travelers.length > 0) {
        setTravelers(data.travelers);
      } else {
        setTravelers([{ id: '1', name: '', ageGroup: '', budget: 0 }]);
      }

      // Load itinerary items
      const items = data.items.map(
        (item: ItineraryItem & { place_id?: number; attraction_id?: number }) => ({
          id: `${item.type || 'item'}-${item.place_id || item.attraction_id}-${Date.now()}-${Math.random()}`,
          type: item.place_id ? 'place' : 'attraction',
          place_id: item.place_id,
          attraction_id: item.attraction_id,
          name: item.name,
          day_number: item.day_number,
          time_slot: item.time_slot,
          start_time: item.start_time || '',
          notes: item.notes || '',
          order_index: item.order_index,
          category: item.category,
        })
      );
      setItinerary(items);

      // Switch to create tab
      setActiveTab('create');
      alert('Plan loaded for editing. Update and save when ready.');
    } catch (error) {
      console.error('Failed to load plan for editing:', error);
      alert('Failed to load plan for editing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlan = async (planId: number) => {
    if (!confirm('Are you sure you want to delete this trip plan? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/trip-plans/${planId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        alert('Trip plan deleted successfully');
        loadSavedPlans();
      } else {
        throw new Error('Failed to delete');
      }
    } catch (error) {
      console.error('Failed to delete plan:', error);
      alert('Failed to delete trip plan');
    } finally {
      setIsLoading(false);
    }
  };

  const dayItems = itinerary.filter((i) => i.day_number === currentDay);
  const totalDays = calculateDays();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 md:px-6 lg:px-8 py-6 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Trip Planner</h1>
            <p className="text-muted-foreground mt-1">Plan your safe and memorable journey</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="create">Create New Plan</TabsTrigger>
              <TabsTrigger value="plans">My Plans</TabsTrigger>
            </TabsList>

            {/* CREATE NEW PLAN TAB */}
            <TabsContent value="create" className="space-y-6 mt-6">
              {/* Basic Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Trip Details</CardTitle>
                  <CardDescription>Enter your trip information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="trip-name">Trip Name *</Label>
                      <Input
                        id="trip-name"
                        placeholder="e.g., Weekend Getaway"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City *</Label>
                      <Select value={selectedCity} onValueChange={setSelectedCity}>
                        <SelectTrigger id="city">
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
                      <Label>Start Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div>
                      <Label>End Date *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            disabled={(date) => (startDate ? date < startDate : false)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div>
                    <Label>Trip Notes</Label>
                    <Textarea
                      placeholder="Add any additional notes about your trip..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Travelers Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Travelers</CardTitle>
                      <CardDescription>Add travelers and their budgets</CardDescription>
                    </div>
                    <Button onClick={addTraveler} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Traveler
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {travelers.map((traveler, index) => (
                      <div
                        key={traveler.id}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg"
                      >
                        <div>
                          <Label>Name</Label>
                          <Input
                            placeholder={`Traveler ${index + 1}`}
                            value={traveler.name}
                            onChange={(e) => updateTraveler(traveler.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Age Group</Label>
                          <Select
                            value={traveler.ageGroup}
                            onValueChange={(value) =>
                              updateTraveler(traveler.id, 'ageGroup', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select age" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="child">Child (0-12)</SelectItem>
                              <SelectItem value="teen">Teen (13-17)</SelectItem>
                              <SelectItem value="adult">Adult (18-59)</SelectItem>
                              <SelectItem value="senior">Senior (60+)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Budget (₹)</Label>
                          <Input
                            type="number"
                            placeholder="5000"
                            value={traveler.budget || ''}
                            onChange={(e) =>
                              updateTraveler(traveler.id, 'budget', parseInt(e.target.value) || 0)
                            }
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTraveler(traveler.id)}
                            disabled={travelers.length === 1}
                            className="w-full"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Total Budget:</span>
                        <span className="text-lg font-bold text-primary">
                          ₹{travelers.reduce((sum, t) => sum + (t.budget || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Preferences</CardTitle>
                  <CardDescription>What kind of places interest you?</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {PREFERENCES.map((pref) => {
                      const Icon = pref.icon;
                      const isSelected = preferences.includes(pref.value);
                      return (
                        <div
                          key={pref.value}
                          onClick={() => {
                            if (isSelected) {
                              setPreferences(preferences.filter((p) => p !== pref.value));
                            } else {
                              setPreferences([...preferences, pref.value]);
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon
                            className={`w-8 h-8 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                          />
                          <span
                            className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                          >
                            {pref.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Itinerary Builder */}
              {selectedCity && startDate && endDate && (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Build Itinerary</CardTitle>
                          <CardDescription>
                            {totalDays} day{totalDays > 1 ? 's' : ''} trip
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => (
                            <Button
                              key={day}
                              variant={currentDay === day ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentDay(day)}
                            >
                              Day {day}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Available Places */}
                        <div className="lg:col-span-1 space-y-4">
                          <div>
                            <h3 className="font-semibold mb-3">Suggested Places</h3>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {attractions.length === 0 && places.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                  <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                                  <p className="text-sm font-medium">Loading places...</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {preferences.length === 0
                                      ? 'Select city and preferences above'
                                      : 'Fetching suggestions...'}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-muted-foreground">
                                      {attractions.length + places.length} places available
                                    </span>
                                  </div>

                                  {attractions.map((attraction) => (
                                    <div
                                      key={`attr-${attraction.id}`}
                                      className="flex items-center justify-between p-2 border rounded hover:bg-accent transition"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">
                                          {attraction.name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge variant="secondary" className="text-xs">
                                            {attraction.category}
                                          </Badge>
                                          <span className="text-xs text-muted-foreground">
                                            ★ {attraction.rating}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addToItinerary(attraction, 'attraction')}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}

                                  {places.map((place) => (
                                    <div
                                      key={`place-${place.id}`}
                                      className="flex items-center justify-between p-2 border rounded hover:bg-accent transition"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{place.name}</p>
                                        {place.category && (
                                          <Badge variant="outline" className="text-xs mt-1">
                                            {place.category}
                                          </Badge>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => addToItinerary(place, 'place')}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Day Itinerary */}
                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Day {currentDay} Schedule</h3>
                            <span className="text-sm text-muted-foreground">
                              {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          {dayItems.length === 0 ? (
                            <div className="border-2 border-dashed rounded-lg p-8 text-center">
                              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                              <p className="text-muted-foreground">
                                Add places from the left to build your itinerary
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Drag and drop to reorder
                              </p>
                            </div>
                          ) : (
                            <DndContext
                              sensors={sensors}
                              collisionDetection={closestCenter}
                              onDragEnd={handleDragEnd}
                            >
                              <SortableContext
                                items={dayItems.map((i) => i.id)}
                                strategy={verticalListSortingStrategy}
                              >
                                <div className="space-y-2">
                                  {dayItems.map((item) => (
                                    <SortableItem
                                      key={item.id}
                                      item={item}
                                      onEdit={(item: ItineraryItem) => {
                                        setEditItem(item);
                                        setShowEditDialog(true);
                                      }}
                                      onDelete={deleteItem}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Save Button */}
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setItinerary([])}>
                      Clear All
                    </Button>
                    <Button onClick={saveTripPlan} disabled={isLoading || itinerary.length === 0}>
                      <Save className="w-4 h-4 mr-2" />
                      {isLoading ? 'Saving...' : 'Save Trip Plan'}
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>

            {/* MY PLANS TAB */}
            <TabsContent value="plans" className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading your plans...</p>
                </div>
              ) : savedPlans.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Trip Plans Yet</h3>
                    <p className="text-muted-foreground mb-4">Start planning your next adventure</p>
                    <Button onClick={() => setActiveTab('create')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Plan
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedPlans.map((plan) => (
                    <Card key={plan.id} className="hover:shadow-lg transition">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="truncate">{plan.name}</span>
                          <Badge>{plan.item_count || 0} stops</Badge>
                        </CardTitle>
                        <CardDescription>{plan.city_name}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarIcon className="w-4 h-4" />
                            <span>
                              {format(new Date(plan.start_date), 'MMM d')} -{' '}
                              {format(new Date(plan.end_date), 'MMM d, yyyy')}
                            </span>
                          </div>
                          {plan.preferences && plan.preferences.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {plan.preferences.map((pref) => (
                                <Badge key={pref} variant="secondary" className="text-xs">
                                  {PREFERENCES.find((p) => p.value === pref)?.label || pref}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleViewPlan(plan.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditPlan(plan.id)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePlan(plan.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>Update the details for this activity</DialogDescription>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Time Slot</Label>
                <Select
                  value={editItem.time_slot}
                  onValueChange={(value) => setEditItem({ ...editItem, time_slot: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Start Time (optional)</Label>
                <Input
                  type="time"
                  value={editItem.start_time || ''}
                  onChange={(e) => setEditItem({ ...editItem, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editItem.notes}
                  onChange={(e) => setEditItem({ ...editItem, notes: e.target.value })}
                  placeholder="Add notes about this activity..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedItem}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewPlan?.name}</DialogTitle>
            <DialogDescription>
              {viewPlan?.city_name} •{' '}
              {viewPlan?.start_date && format(new Date(viewPlan.start_date), 'MMM d')} -{' '}
              {viewPlan?.end_date && format(new Date(viewPlan.end_date), 'MMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>

          {viewPlan && (
            <div className="space-y-6 py-4">
              {/* Preferences */}
              {viewPlan.preferences && viewPlan.preferences.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Preferences</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewPlan.preferences.map((pref: string) => {
                      const prefData = PREFERENCES.find((p) => p.value === pref);
                      const Icon = prefData?.icon;
                      return (
                        <Badge key={pref} variant="secondary" className="gap-1">
                          {Icon && <Icon className="w-3 h-3" />}
                          {prefData?.label || pref}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewPlan.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground">{viewPlan.notes}</p>
                </div>
              )}

              {/* Travelers */}
              {viewPlan.travelers &&
                Array.isArray(viewPlan.travelers) &&
                viewPlan.travelers.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Travelers</h4>
                    <div className="space-y-2">
                      {viewPlan.travelers.map((traveler: Traveler, idx: number) => (
                        <div key={idx} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{traveler.name || 'Unnamed'}</div>
                            <div className="text-xs text-muted-foreground">
                              {traveler.ageGroup || 'No age group'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              ₹{traveler.budget?.toLocaleString() || 0}
                            </div>
                            <div className="text-xs text-muted-foreground">Budget</div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">Total Budget</span>
                        <span className="text-lg font-bold">
                          ₹
                          {viewPlan.travelers
                            .reduce((sum: number, t: Traveler) => sum + (t.budget || 0), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Itinerary by Day */}
              <div>
                <h4 className="font-semibold mb-3">Itinerary</h4>
                {viewPlan.items && viewPlan.items.length > 0 ? (
                  <div className="space-y-4">
                    {Array.from(
                      new Set(viewPlan.items.map((item: ItineraryItem) => item.day_number))
                    )
                      .sort()
                      .map((day: number) => (
                        <div key={day} className="border rounded-lg p-4">
                          <h5 className="font-semibold mb-3 flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4" />
                            Day {day}
                          </h5>
                          <div className="space-y-2">
                            {viewPlan.items
                              .filter((item: ItineraryItem) => item.day_number === day)
                              .sort(
                                (a: ItineraryItem, b: ItineraryItem) =>
                                  a.order_index - b.order_index
                              )
                              .map((item: ItineraryItem, idx: number) => {
                                const timeSlot = TIME_SLOTS.find((t) => t.value === item.time_slot);
                                const TimeIcon = timeSlot?.icon;
                                return (
                                  <div key={idx} className="flex gap-3 p-3 bg-muted rounded-lg">
                                    <div className="flex-shrink-0 pt-1">
                                      {TimeIcon && (
                                        <TimeIcon className="w-4 h-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium">{item.name}</div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {timeSlot?.label}
                                        {item.start_time && ` • ${item.start_time}`}
                                      </div>
                                      {item.notes && (
                                        <p className="text-sm text-muted-foreground mt-2">
                                          {item.notes}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No itinerary items added</p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setShowViewDialog(false);
                if (viewPlan?.id) handleEditPlan(viewPlan.id);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
