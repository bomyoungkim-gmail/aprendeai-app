import { useState, useEffect } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

interface UseScrollDirectionOptions {
  threshold?: number; // Minimum scroll distance to trigger direction change
  initialDirection?: ScrollDirection;
}

/**
 * Custom hook to detect scroll direction
 * Returns 'up' when scrolling up, 'down' when scrolling down
 * 
 * Best practice for auto-hiding headers on scroll
 */
export function useScrollDirection({
  threshold = 10,
  initialDirection = null,
  elementRef,
  excludeRef,
}: UseScrollDirectionOptions & { 
  elementRef?: React.RefObject<HTMLElement>;
  excludeRef?: React.RefObject<HTMLElement>;
} = {}): ScrollDirection {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(initialDirection);

  useEffect(() => {
    let lastScrollY = 0;
    let ticking = false;

    const updateScrollDirection = (scrollY: number) => {
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      setScrollDirection(scrollY > lastScrollY ? 'down' : 'up');
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Ignore events from excluded containers (e.g. Sidebar)
      if (excludeRef?.current && excludeRef.current.contains(target)) {
        return;
      }

      if (!ticking) {
        window.requestAnimationFrame(() => updateScrollDirection(target.scrollTop || window.scrollY));
        ticking = true;
      }
    };

    const targetElement = elementRef?.current || window;
    const options = elementRef?.current ? { passive: true } : { capture: true, passive: true };

    targetElement.addEventListener('scroll', onScroll, options);

    return () => targetElement.removeEventListener('scroll', onScroll, options as any);
  }, [threshold, elementRef, excludeRef]);

  return scrollDirection;
}
