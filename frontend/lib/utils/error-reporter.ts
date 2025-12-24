/**
 * Centralized Error Reporting Utility
 * 
 * Logs errors to console in development and can be extended
 * to integrate with error monitoring services (Sentry, LogRocket, etc.)
 */

export interface ErrorReport {
  error: Error;
  errorInfo?: any;
  context?: {
    userId?: string;
    route?: string;
    timestamp?: string;
    userAgent?: string;
  };
}

/**
 * Report an error to the error tracking service
 */
export function reportError(report: ErrorReport): void {
  const { error, errorInfo, context } = report;

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.group('🔴 Error Report');
    console.error('Error:', error);
    if (errorInfo) {
      console.error('Error Info:', errorInfo);
    }
    if (context) {
      console.log('Context:', context);
    }
    console.groupEnd();
  }

  // TODO: In production, send to error monitoring service
  // Example: Sentry.captureException(error, { contexts: { react: errorInfo }, tags: context });
  
  // For now, always log the error name and message
  console.error(`[Error Reporter] ${error.name}: ${error.message}`);
}

/**
 * Create a standardized error context
 */
export function createErrorContext(additionalContext?: Record<string, any>) {
  return {
    route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...additionalContext,
  };
}
