import { copy } from './copy';
import { Section } from './Section';

export const HowItWorks = () => {
  const { howItWorks } = copy;
  
  return (
    <Section id="como-funciona" className="bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          {howItWorks.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Column A - Dashboard */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
            {howItWorks.colA.title}
          </h3>
          <ul className="space-y-4">
            {howItWorks.colA.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <span className="text-blue-500 font-bold mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Column B - Reader */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
            {howItWorks.colB.title}
          </h3>
          <ul className="space-y-4">
            {howItWorks.colB.bullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-700">
                <span className="text-purple-500 font-bold mt-1">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};
