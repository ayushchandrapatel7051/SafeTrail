import { Map, Bell, FileText, BarChart3, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Map,
    title: "Safe Zone Visualization",
    description: "Interactive maps showing safe and unsafe zones with color-coded markers based on real-time safety scores.",
    color: "text-safe",
    bgColor: "bg-safe/10",
  },
  {
    icon: Bell,
    title: "Real-time Alerts",
    description: "Instant notifications about safety incidents, emergencies, and important updates in your area.",
    color: "text-accent",
    bgColor: "bg-accent/10",
  },
  {
    icon: FileText,
    title: "Quick Reporting",
    description: "Report incidents easily with geolocation, photos, and categories. Help keep others safe.",
    color: "text-caution",
    bgColor: "bg-caution/10",
  },
  {
    icon: BarChart3,
    title: "Safety Scores",
    description: "Every location has a safety score based on verified reports, helping you make informed decisions.",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    icon: Phone,
    title: "Emergency Help",
    description: "One-tap access to emergency services, local helplines, and quick SOS actions when you need them.",
    color: "text-danger",
    bgColor: "bg-danger/10",
  },
];

const FeatureBoxes = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to Stay Safe
          </h2>
          <p className="text-muted-foreground text-lg">
            Powerful features designed to keep you informed and protected wherever your travels take you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group relative overflow-hidden border-border/50 bg-card hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${feature.bgColor} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
              
              {/* Hover gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeatureBoxes;
