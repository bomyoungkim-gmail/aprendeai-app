import { copy } from './copy';
import { Section } from './Section';

export const FAQ = () => {
  const { faq } = copy;
  
  return (
    <Section id="faq" className="bg-gray-50">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900">
          {faq.title}
        </h2>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {faq.questions.map((item, i) => (
          <details key={i} className="group bg-white rounded-lg border border-gray-200">
            <summary className="flex items-center justify-between p-6 cursor-pointer list-none font-medium text-gray-900 group-open:text-blue-600 transition-colors">
              {item.q}
              <span className="transform group-open:rotate-180 transition-transform text-gray-400">
                ▼
              </span>
            </summary>
            <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
};
