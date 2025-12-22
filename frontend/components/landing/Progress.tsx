import { copy } from './copy';
import { Section } from './Section';

export const Progress = () => {
  const { progress } = copy;
  
  return (
    <Section id="progresso" className="bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {progress.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {progress.cards.map((card, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-start gap-4 h-full">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {i + 1}
            </div>
            <p className="text-gray-700 text-sm font-medium">
              {card}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
};
