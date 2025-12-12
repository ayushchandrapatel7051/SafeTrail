import { MapPin, Search, Shield, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: Search,
    step: '01',
    title: 'Search Your Destination',
    description:
      "Enter the city or area you're planning to visit. Our system will load safety data for that region.",
  },
  {
    icon: MapPin,
    step: '02',
    title: 'Explore the Safety Map',
    description:
      'View color-coded zones showing safety levels. Green is safe, yellow needs caution, red is risky.',
  },
  {
    icon: Shield,
    step: '03',
    title: 'Stay Informed',
    description:
      'Receive real-time alerts and check safety scores for specific places like hotels, transit, and attractions.',
  },
  {
    icon: CheckCircle,
    step: '04',
    title: 'Report & Contribute',
    description:
      'Help others by reporting incidents. Verified reports improve safety data for the entire community.',
  },
];

const HowItWorks = () => {
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How SafeTrail Works</h2>
          <p className="text-muted-foreground text-lg">
            Four simple steps to safer travels. Get started in minutes.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={step.step} className="relative group">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/30 to-transparent" />
                )}

                <div className="text-center">
                  {/* Step number */}
                  <div className="relative inline-flex items-center justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                      <step.icon className="w-9 h-9 text-primary" />
                    </div>
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg">
                      {step.step}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
