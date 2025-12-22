import { copy } from './copy';
import { Section } from './Section';

export const SystemSteps = () => {
  const { systemSteps } = copy;
  
  return (
    <Section id="sistema">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
          {systemSteps.title}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {systemSteps.steps.map((step, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-4">
              {i + 1}
            </div>
            <p className="text-gray-800 font-medium leading-snug">
              {step}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
};
