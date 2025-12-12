import { MapPin, Shield, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock data for map preview
const mockLocations = [
  { id: 1, name: 'Central Station', score: 92, status: 'safe', x: 45, y: 35 },
  { id: 2, name: 'Old Market', score: 68, status: 'caution', x: 65, y: 50 },
  { id: 3, name: 'Night District', score: 35, status: 'danger', x: 30, y: 65 },
  { id: 4, name: 'Business Park', score: 88, status: 'safe', x: 70, y: 30 },
  { id: 5, name: 'Tourist Area', score: 75, status: 'caution', x: 50, y: 55 },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'safe':
      return 'bg-safe text-safe-foreground';
    case 'caution':
      return 'bg-caution text-caution-foreground';
    case 'danger':
      return 'bg-danger text-danger-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getMarkerColor = (status: string) => {
  switch (status) {
    case 'safe':
      return 'text-safe';
    case 'caution':
      return 'text-caution';
    case 'danger':
      return 'text-danger';
    default:
      return 'text-muted-foreground';
  }
};

const MapPreview = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See Safety at a Glance</h2>
          <p className="text-muted-foreground text-lg">
            Our interactive map shows you exactly where it's safe to go. Color-coded zones make it
            easy to plan your route.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
            {/* Mock Map Background */}
            <div className="relative h-[500px] bg-gradient-to-br from-muted via-secondary to-muted overflow-hidden">
              {/* Grid pattern */}
              <div className="absolute inset-0 opacity-30">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        className="text-border"
                      />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Safety zones (mock) */}
              <div className="absolute top-[20%] left-[35%] w-32 h-32 rounded-full bg-safe/20 blur-xl" />
              <div className="absolute top-[40%] left-[55%] w-40 h-40 rounded-full bg-caution/20 blur-xl" />
              <div className="absolute top-[50%] left-[20%] w-28 h-28 rounded-full bg-danger/20 blur-xl" />
              <div className="absolute top-[15%] left-[60%] w-36 h-36 rounded-full bg-safe/20 blur-xl" />

              {/* Location markers */}
              {mockLocations.map((location) => (
                <div
                  key={location.id}
                  className="absolute group cursor-pointer animate-float"
                  style={{
                    left: `${location.x}%`,
                    top: `${location.y}%`,
                    animationDelay: `${location.id * 0.2}s`,
                  }}
                >
                  <div className="relative">
                    <MapPin
                      className={`w-8 h-8 ${getMarkerColor(location.status)} drop-shadow-lg`}
                      fill="currentColor"
                      fillOpacity={0.2}
                    />

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                      <div className="bg-card rounded-lg shadow-xl border border-border p-3 whitespace-nowrap">
                        <div className="font-semibold text-sm mb-1">{location.name}</div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(location.status)} text-xs`}>
                            Score: {location.score}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Legend */}
              <div className="absolute bottom-4 left-4 glass rounded-xl p-4">
                <div className="text-xs font-semibold mb-3">Safety Legend</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-safe" />
                    <span className="text-xs text-muted-foreground">Safe (80-100)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-caution" />
                    <span className="text-xs text-muted-foreground">Caution (50-79)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-danger" />
                    <span className="text-xs text-muted-foreground">Risky (0-49)</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="absolute top-4 right-4 glass rounded-xl p-4">
                <div className="text-xs font-semibold mb-3">Demo City Stats</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-safe" />
                    <span className="text-xs">2 Safe zones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-caution" />
                    <span className="text-xs">2 Caution areas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-danger" />
                    <span className="text-xs">1 Risky zone</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="bg-card border-t border-border p-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Demo City</span> • 5 locations mapped
              </div>
              <Button className="shadow-lg">Open Full Map</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MapPreview;
