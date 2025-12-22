import Link from 'next/link';
import { copy } from './copy';

export const Footer = () => {
  const { footer } = copy;
  
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-sm text-gray-500">
          {footer.text}
        </p>
        
        <div className="flex gap-6">
          {footer.links.map((link) => (
            <Link 
              key={link.href} 
              href={link.href} 
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
};
