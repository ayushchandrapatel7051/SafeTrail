import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import FeatureBoxes from '@/components/landing/FeatureBoxes';
import HowItWorks from '@/components/landing/HowItWorks';
import MapPreview from '@/components/landing/MapPreview';
import Footer from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FeatureBoxes />
      <HowItWorks />
      <MapPreview />
      <Footer />
    </div>
  );
};

export default Index;
