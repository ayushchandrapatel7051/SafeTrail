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
  // New Delhi (cityId: 1)
  { id: 1, name: "Connaught Place", cityId: 1, coordinates: [28.6315, 77.2167], safetyScore: 85, reportCount: 5, type: "market" },
  { id: 2, name: "Chandni Chowk", cityId: 1, coordinates: [28.6506, 77.2303], safetyScore: 62, reportCount: 12, type: "market" },
  { id: 3, name: "India Gate", cityId: 1, coordinates: [28.6129, 77.2295], safetyScore: 92, reportCount: 2, type: "landmark" },
  { id: 4, name: "Paharganj", cityId: 1, coordinates: [28.6448, 77.2140], safetyScore: 45, reportCount: 18, type: "neighborhood" },
  { id: 5, name: "Sarojini Nagar", cityId: 1, coordinates: [28.5745, 77.1989], safetyScore: 70, reportCount: 8, type: "market" },
  { id: 6, name: "Karol Bagh", cityId: 1, coordinates: [28.6514, 77.1907], safetyScore: 68, reportCount: 10, type: "neighborhood" },
  
  // Mumbai (cityId: 2)
  { id: 7, name: "Gateway of India", cityId: 2, coordinates: [18.9220, 72.8347], safetyScore: 88, reportCount: 4, type: "landmark" },
  { id: 8, name: "Colaba", cityId: 2, coordinates: [18.9067, 72.8147], safetyScore: 75, reportCount: 9, type: "neighborhood" },
  { id: 9, name: "Dharavi", cityId: 2, coordinates: [19.0430, 72.8550], safetyScore: 35, reportCount: 25, type: "neighborhood" },
  { id: 10, name: "Bandra", cityId: 2, coordinates: [19.0596, 72.8295], safetyScore: 82, reportCount: 6, type: "neighborhood" },
  { id: 11, name: "Marine Drive", cityId: 2, coordinates: [18.9432, 72.8236], safetyScore: 80, reportCount: 3, type: "landmark" },
  { id: 12, name: "Andheri", cityId: 2, coordinates: [19.1136, 72.8697], safetyScore: 72, reportCount: 7, type: "neighborhood" },
  
  // Bangalore (cityId: 3)
  { id: 13, name: "MG Road", cityId: 3, coordinates: [12.9789, 77.6064], safetyScore: 88, reportCount: 2, type: "market" },
  { id: 14, name: "Indiranagar", cityId: 3, coordinates: [13.0011, 77.6410], safetyScore: 84, reportCount: 4, type: "neighborhood" },
  { id: 15, name: "Koramangala", cityId: 3, coordinates: [12.9352, 77.6245], safetyScore: 80, reportCount: 5, type: "neighborhood" },
  { id: 16, name: "Brigade Road", cityId: 3, coordinates: [12.9716, 77.5948], safetyScore: 86, reportCount: 3, type: "market" },
  
  // Jaipur (cityId: 4)
  { id: 17, name: "City Palace", cityId: 4, coordinates: [26.9245, 75.8255], safetyScore: 88, reportCount: 2, type: "landmark" },
  { id: 18, name: "Bapu Bazaar", cityId: 4, coordinates: [26.9124, 75.7873], safetyScore: 70, reportCount: 8, type: "market" },
  { id: 19, name: "Jantar Mantar", cityId: 4, coordinates: [26.9246, 75.8235], safetyScore: 90, reportCount: 1, type: "landmark" },
  
  // Hyderabad (cityId: 5)
  { id: 20, name: "Charminar", cityId: 5, coordinates: [17.3629, 78.4695], safetyScore: 75, reportCount: 6, type: "landmark" },
  { id: 21, name: "Secunderabad", cityId: 5, coordinates: [17.3700, 78.4992], safetyScore: 80, reportCount: 4, type: "neighborhood" },
  
  // New York (cityId: 6)
  { id: 22, name: "Times Square", cityId: 6, coordinates: [40.7580, -73.9855], safetyScore: 78, reportCount: 8, type: "landmark" },
  { id: 23, name: "Central Park", cityId: 6, coordinates: [40.7829, -73.9654], safetyScore: 82, reportCount: 5, type: "landmark" },
  
  // Los Angeles (cityId: 7)
  { id: 24, name: "Hollywood", cityId: 7, coordinates: [34.1016, -118.3267], safetyScore: 72, reportCount: 10, type: "neighborhood" },
  
  // Chicago (cityId: 8)
  { id: 25, name: "The Loop", cityId: 8, coordinates: [41.8827, -87.6233], safetyScore: 75, reportCount: 7, type: "neighborhood" },
  
  // Houston (cityId: 9)
  { id: 26, name: "Downtown Houston", cityId: 9, coordinates: [29.7578, -95.3632], safetyScore: 70, reportCount: 6, type: "neighborhood" },
  
  // London (cityId: 10)
  { id: 27, name: "Oxford Street", cityId: 10, coordinates: [51.5153, -0.1386], safetyScore: 80, reportCount: 5, type: "market" },
  { id: 28, name: "Big Ben", cityId: 10, coordinates: [51.4996, -0.1241], safetyScore: 85, reportCount: 2, type: "landmark" },
  
  // Manchester (cityId: 11)
  { id: 29, name: "Manchester City Center", cityId: 11, coordinates: [53.4829, -2.2428], safetyScore: 75, reportCount: 6, type: "neighborhood" },
  
  // Birmingham (cityId: 12)
  { id: 30, name: "Bull Ring", cityId: 12, coordinates: [52.5050, -1.8881], safetyScore: 76, reportCount: 5, type: "market" },
  
  // Toronto (cityId: 13)
  { id: 31, name: "Eaton Centre", cityId: 13, coordinates: [43.6636, -79.3957], safetyScore: 84, reportCount: 3, type: "market" },
  
  // Vancouver (cityId: 14)
  { id: 32, name: "Granville Street", cityId: 14, coordinates: [49.2820, -123.1114], safetyScore: 86, reportCount: 2, type: "neighborhood" },
  
  // Montreal (cityId: 15)
  { id: 33, name: "Old Montreal", cityId: 15, coordinates: [45.5063, -73.5644], safetyScore: 82, reportCount: 4, type: "neighborhood" },
  
  // Sydney (cityId: 16)
  { id: 34, name: "Opera House", cityId: 16, coordinates: [-33.8568, 151.2153], safetyScore: 88, reportCount: 2, type: "landmark" },
  { id: 35, name: "Bondi Beach", cityId: 16, coordinates: [-33.8906, 151.2763], safetyScore: 85, reportCount: 3, type: "landmark" },
  
  // Melbourne (cityId: 17)
  { id: 36, name: "Southbank", cityId: 17, coordinates: [-37.8231, 144.9688], safetyScore: 86, reportCount: 2, type: "neighborhood" },
  
  // Brisbane (cityId: 18)
  { id: 37, name: "South Bank", cityId: 18, coordinates: [-27.4848, 153.0205], safetyScore: 84, reportCount: 3, type: "neighborhood" },
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
