import Link from 'next/link';
import { copy } from './copy';

export const Header = () => {
  const { header } = copy;
  
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl md:text-2xl text-gray-900 tracking-tight">
          {header.logo}
        </Link>
        
        <nav className="hidden md:flex items-center gap-8">
          {header.nav.map((item) => (
            <a 
              key={item.href} 
              href={item.href} 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
        
        <div className="flex items-center gap-4">
          <Link 
            href={header.cta.href}
            className="hidden md:inline-flex items-center justify-center h-10 px-6 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {header.cta.label}
          </Link>
          
          {/* Mobile Menu Button can be added here if needed */}
        </div>
      </div>
    </header>
  );
};
