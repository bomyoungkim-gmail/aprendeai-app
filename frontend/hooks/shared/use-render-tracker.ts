import { useRef, useEffect } from 'react';

/**
 * Hook to monitor performance and re-renders of components
 * @param componentName Name of the component to monitor
 * @param props Props to track for changes
 */
export function useRenderTracker(componentName: string, props: Record<string, any> = {}) {
  const renderCount = useRef(0);
  const previousProps = useRef(props);
  const lastRenderTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    // Calculate changed props
    const changedProps = Object.keys(props).reduce((acc, key) => {
      if (props[key] !== previousProps.current[key]) {
        acc[key] = {
          from: previousProps.current[key],
          to: props[key]
        };
      }
      return acc;
    }, {} as Record<string, any>);

    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed(`[Performance] ${componentName} render #${renderCount.current}`);
      console.log('Time since last render:', `${timeSinceLastRender.toFixed(2)}ms`);
      
      if (Object.keys(changedProps).length > 0) {
        console.log('Changed props:', changedProps);
      } else {
        console.log('No props changed (might be state update or parent render)');
      }
      console.groupEnd();
    }

    previousProps.current = props;
    lastRenderTime.current = now;
  });

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current
  };
}
