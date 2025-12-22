import { copy } from './copy';
import { Section } from './Section';

export const Problem = () => {
  const { problem } = copy;
  
  return (
    <Section id="problema" className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {problem.title}
        </h2>
        {problem.text && (
          <p className="text-lg text-gray-600 leading-relaxed">
            {problem.text}
          </p>
        )}

        {problem.bullets && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {problem.bullets.map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
                <p className="text-gray-800 font-medium">{item}</p>
              </div>
            ))}
          </div>
        )}

        <p className="text-lg font-semibold text-gray-900">
          {problem.final}
        </p>
      </div>
    </Section>
  );
};
