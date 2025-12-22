import { Header } from './Header';
import { Hero } from './Hero';
import { Problem } from './Problem';
import { SystemSteps } from './SystemSteps';
import { WhyItWorks } from './WhyItWorks';
import { HowItWorks } from './HowItWorks';
import { Audience } from './Audience';
import { Progress } from './Progress';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { Footer } from './Footer';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Header />
      <main>
        <Hero />
        <Problem />
        <SystemSteps />
        <WhyItWorks />
        <HowItWorks />
        <Audience />
        <Progress />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};
