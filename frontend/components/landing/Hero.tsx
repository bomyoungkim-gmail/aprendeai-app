import Link from 'next/link';
import { copy } from './copy';

export const Hero = () => {
  const { hero } = copy;
  
  return (
    <section id="top" className="py-20 md:py-28 px-4 bg-gradient-to-br from-white to-blue-50/50">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-[1.15]">
          {hero.h1}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          {hero.subheadline}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href={hero.ctaPrimary.href}
            className="w-full sm:w-auto h-12 px-8 flex items-center justify-center font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {hero.ctaPrimary.label}
          </Link>
          <a
            href={hero.ctaSecondary.href}
            className="w-full sm:w-auto h-12 px-8 flex items-center justify-center font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {hero.ctaSecondary.label}
          </a>
        </div>

        {hero.bullets && hero.bullets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-3xl mx-auto">
            {hero.bullets.map((bullet, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-gray-600 bg-white/60 p-4 rounded-lg border border-gray-100/50">
                <span className="text-green-500 font-bold">✓</span>
                {bullet}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
