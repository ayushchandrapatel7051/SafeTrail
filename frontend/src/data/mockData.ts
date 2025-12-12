export interface City {
  id: number;
  name: string;
  country: string;
  coordinates: [number, number];
  safetyScore: number;
  placesCount: number;
  reportsCount: number;
}

export interface Place {
  id: number;
  name: string;
  cityId: number;
  coordinates: [number, number];
  safetyScore: number;
  reportCount: number;
  type: string;
}

export interface Report {
  id: number;
  placeId: number;
  placeName: string;
  type: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
  coordinates: [number, number];
}

export interface Alert {
  id: number;
  title: string;
  body: string;
  severity: number;
  createdAt: string;
}

export const cities: City[] = [
  // India
  { id: 1, name: "New Delhi", country: "India", coordinates: [28.6139, 77.2090], safetyScore: 72, placesCount: 15, reportsCount: 45 },
  { id: 2, name: "Mumbai", country: "India", coordinates: [19.0760, 72.8777], safetyScore: 68, placesCount: 20, reportsCount: 62 },
  { id: 3, name: "Bangalore", country: "India", coordinates: [12.9716, 77.5946], safetyScore: 78, placesCount: 12, reportsCount: 28 },
  { id: 4, name: "Jaipur", country: "India", coordinates: [26.9124, 75.7873], safetyScore: 75, placesCount: 10, reportsCount: 22 },
  { id: 5, name: "Hyderabad", country: "India", coordinates: [17.3850, 78.4867], safetyScore: 80, placesCount: 14, reportsCount: 18 },
  // USA
  { id: 6, name: "New York", country: "USA", coordinates: [40.7128, -74.0060], safetyScore: 70, placesCount: 18, reportsCount: 52 },
  { id: 7, name: "Los Angeles", country: "USA", coordinates: [34.0522, -118.2437], safetyScore: 65, placesCount: 16, reportsCount: 48 },
  { id: 8, name: "Chicago", country: "USA", coordinates: [41.8781, -87.6298], safetyScore: 72, placesCount: 12, reportsCount: 35 },
  { id: 9, name: "Houston", country: "USA", coordinates: [29.7604, -95.3698], safetyScore: 68, placesCount: 10, reportsCount: 28 },
  // UK
  { id: 10, name: "London", country: "UK", coordinates: [51.5074, -0.1278], safetyScore: 75, placesCount: 20, reportsCount: 58 },
  { id: 11, name: "Manchester", country: "UK", coordinates: [53.4808, -2.2426], safetyScore: 70, placesCount: 12, reportsCount: 32 },
  { id: 12, name: "Birmingham", country: "UK", coordinates: [52.5086, -1.8755], safetyScore: 68, placesCount: 10, reportsCount: 25 },
  // Canada
  { id: 13, name: "Toronto", country: "Canada", coordinates: [43.6532, -79.3832], safetyScore: 80, placesCount: 16, reportsCount: 38 },
  { id: 14, name: "Vancouver", country: "Canada", coordinates: [49.2827, -123.1207], safetyScore: 82, placesCount: 14, reportsCount: 32 },
  { id: 15, name: "Montreal", country: "Canada", coordinates: [45.5017, -73.5673], safetyScore: 78, placesCount: 12, reportsCount: 28 },
  // Australia
  { id: 16, name: "Sydney", country: "Australia", coordinates: [-33.8688, 151.2093], safetyScore: 85, placesCount: 18, reportsCount: 42 },
  { id: 17, name: "Melbourne", country: "Australia", coordinates: [-37.8136, 144.9631], safetyScore: 83, placesCount: 16, reportsCount: 36 },
  { id: 18, name: "Brisbane", country: "Australia", coordinates: [-27.4698, 153.0251], safetyScore: 80, placesCount: 12, reportsCount: 28 },
];

export const places: Place[] = [
  { id: 1, name: "Connaught Place", cityId: 1, coordinates: [28.6315, 77.2167], safetyScore: 85, reportCount: 5, type: "market" },
  { id: 2, name: "Chandni Chowk", cityId: 1, coordinates: [28.6506, 77.2303], safetyScore: 62, reportCount: 12, type: "market" },
  { id: 3, name: "India Gate", cityId: 1, coordinates: [28.6129, 77.2295], safetyScore: 92, reportCount: 2, type: "landmark" },
  { id: 4, name: "Paharganj", cityId: 1, coordinates: [28.6448, 77.2140], safetyScore: 45, reportCount: 18, type: "neighborhood" },
  { id: 5, name: "Sarojini Nagar", cityId: 1, coordinates: [28.5745, 77.1989], safetyScore: 70, reportCount: 8, type: "market" },
  { id: 6, name: "Karol Bagh", cityId: 1, coordinates: [28.6514, 77.1907], safetyScore: 68, reportCount: 10, type: "neighborhood" },
  { id: 7, name: "Gateway of India", cityId: 2, coordinates: [18.9220, 72.8347], safetyScore: 88, reportCount: 4, type: "landmark" },
  { id: 8, name: "Colaba", cityId: 2, coordinates: [18.9067, 72.8147], safetyScore: 75, reportCount: 9, type: "neighborhood" },
  { id: 9, name: "Dharavi", cityId: 2, coordinates: [19.0430, 72.8550], safetyScore: 35, reportCount: 25, type: "neighborhood" },
  { id: 10, name: "Bandra", cityId: 2, coordinates: [19.0596, 72.8295], safetyScore: 82, reportCount: 6, type: "neighborhood" },
];

export const reports: Report[] = [
  { id: 1, placeId: 4, placeName: "Paharganj", type: "theft", description: "Pickpocket incident near main bazaar", status: "verified", createdAt: "2024-01-15T10:30:00Z", coordinates: [28.6448, 77.2140] },
  { id: 2, placeId: 2, placeName: "Chandni Chowk", type: "harassment", description: "Aggressive vendors and touts", status: "pending", createdAt: "2024-01-14T14:20:00Z", coordinates: [28.6506, 77.2303] },
  { id: 3, placeId: 9, placeName: "Dharavi", type: "scam", description: "Fake tour guide demanding money", status: "pending", createdAt: "2024-01-14T09:15:00Z", coordinates: [19.0430, 72.8550] },
  { id: 4, placeId: 5, placeName: "Sarojini Nagar", type: "theft", description: "Bag snatching reported near market entrance", status: "verified", createdAt: "2024-01-13T16:45:00Z", coordinates: [28.5745, 77.1989] },
  { id: 5, placeId: 6, placeName: "Karol Bagh", type: "cab", description: "Taxi driver overcharging tourists", status: "pending", createdAt: "2024-01-13T11:00:00Z", coordinates: [28.6514, 77.1907] },
  { id: 6, placeId: 8, placeName: "Colaba", type: "hotel", description: "Unlicensed accommodation with safety issues", status: "rejected", createdAt: "2024-01-12T08:30:00Z", coordinates: [18.9067, 72.8147] },
];

export const alerts: Alert[] = [
  { id: 1, title: "Festival Crowd Alert", body: "Large crowds expected in Chandni Chowk area. Stay vigilant.", severity: 2, createdAt: "2024-01-15T08:00:00Z" },
  { id: 2, title: "Weather Warning", body: "Heavy fog expected. Avoid night travel in isolated areas.", severity: 1, createdAt: "2024-01-14T18:00:00Z" },
];

export const reportTypes = [
  { value: "theft", label: "Theft / Pickpocket" },
  { value: "harassment", label: "Harassment" },
  { value: "scam", label: "Scam / Fraud" },
  { value: "cab", label: "Cab / Transport Issue" },
  { value: "hotel", label: "Hotel / Accommodation" },
  { value: "other", label: "Other" },
];

export const getSafetyStatus = (score: number): 'safe' | 'caution' | 'danger' => {
  if (score >= 80) return 'safe';
  if (score >= 50) return 'caution';
  return 'danger';
};
