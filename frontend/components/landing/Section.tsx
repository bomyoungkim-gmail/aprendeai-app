import { ReactNode } from 'react';

interface SectionProps {
  id: string;
  className?: string;
  children: ReactNode;
}

export const Section = ({ id, className = '', children }: SectionProps) => {
  return (
    <section id={id} className={`py-12 md:py-20 px-4 scroll-mt-20 ${className}`}>
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </section>
  );
};
