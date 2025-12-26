/**
 * Structured logging utility
 * Prevents console.logs in production and provides consistent logging
 */

const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isTest) return false;
    if (level === 'error' || level === 'warn') return true;
    return isDev;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, context || '');
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, context || '');
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, { error, ...context });
    }
    
    // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
    // if (!isDev) {
    //   sendToErrorTracking(message, error, context);
    // }
  }
}

export const logger = new Logger();
