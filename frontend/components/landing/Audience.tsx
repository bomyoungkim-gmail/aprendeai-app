import { copy } from './copy';
import { Section } from './Section';

export const Audience = () => {
  const { audience } = copy;
  
  return (
    <Section id="para-quem">
      <div className="max-w-3xl mx-auto text-center space-y-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          {audience.title}
        </h2>
        <p className="text-lg text-gray-600 leading-relaxed">
          {audience.text}
        </p>
        {audience.callout && (
          <div className="bg-blue-50 text-blue-900 p-6 rounded-lg font-medium border border-blue-100 inline-block">
            {audience.callout}
          </div>
        )}
      </div>
    </Section>
  );
};
