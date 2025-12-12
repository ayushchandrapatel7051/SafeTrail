import { Shield, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Your Safety, Our Priority</span>
          </div>

          {/* Main headline */}
          <h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in"
            style={{ animationDelay: '0.1s' }}
          >
            Travel with
            <span className="text-gradient"> Confidence</span>
            <br />
            Stay Safe Everywhere
          </h1>

          {/* Subtitle */}
          <p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            Real-time safety intelligence for travelers. Get instant alerts, report incidents, and
            explore cities with peace of mind using our interactive safety map.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            <Link to="/map">
              <Button
                size="lg"
                className="h-14 px-8 text-lg gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                <MapPin className="w-5 h-5" />
                Explore Safe Zones
              </Button>
            </Link>
            <Link to="/report">
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg gap-2 hover:bg-secondary transition-all"
              >
                Report an Issue
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div
            className="grid grid-cols-3 gap-8 mt-16 pt-10 border-t border-border/50 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">200+</div>
              <div className="text-sm text-muted-foreground mt-1">Cities Covered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground mt-1">Reports Verified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
