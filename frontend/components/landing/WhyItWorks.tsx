import { copy } from './copy';
import { Section } from './Section';

export const WhyItWorks = () => {
  const { whyItWorks } = copy;
  
  return (
    <Section id="por-que" className="bg-blue-900 text-white">
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-10">
          {whyItWorks.title}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          {whyItWorks.bullets.map((bullet, i) => (
            <div key={i} className="bg-blue-800/50 p-6 rounded-lg border border-blue-700">
              <p className="text-blue-100 leading-relaxed">
                {bullet}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};
