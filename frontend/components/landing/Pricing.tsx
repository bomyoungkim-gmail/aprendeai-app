import Link from 'next/link';
import { copy } from './copy';
import { Section } from './Section';

export const Pricing = () => {
  const { pricing } = copy;
  const { free, pro } = pricing;
  
  return (
    <Section id="planos">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          {pricing.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-20">
        {/* Free Plan */}
        <div className="bg-white p-8 rounded-xl border border-gray-200">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{free.name}</h3>
          </div>
          <ul className="space-y-4 mb-8">
            {free.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-600">
                <span className="text-gray-400">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={free.cta.href}
            className="block w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg text-center transition-colors"
          >
            {free.cta.label}
          </Link>
        </div>

        {/* Pro Plan */}
        <div className="bg-white p-8 rounded-xl border-2 border-blue-600 relative shadow-lg">
          <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
            RECOMENDADO
          </div>
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{pro.name}</h3>
          </div>
          <ul className="space-y-4 mb-8">
            {pro.items.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-700">
                <span className="text-blue-500 font-bold">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <Link
            href={pro.cta.href}
            className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center transition-colors"
          >
            {pro.cta.label}
          </Link>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gray-900 text-white rounded-2xl p-8 md:p-12 text-center max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          {pricing.finalCta.title}
        </h2>
        <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
          {pricing.finalCta.text}
        </p>
        <Link
          href={pricing.finalCta.cta.href}
          className="inline-flex items-center justify-center h-12 px-8 font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 transition-colors"
        >
          {pricing.finalCta.cta.label}
        </Link>
      </div>
    </Section>
  );
};
