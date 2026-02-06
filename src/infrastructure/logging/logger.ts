import pino from 'pino';
import { randomUUID } from 'crypto';
import { config, isDevelopment } from '../../config';

// Create logger instance
const logger = pino({
  level: config.LOG_LEVEL,
  transport: isDevelopment && config.LOG_PRETTY ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.NODE_ENV,
    app: 'crm-cobranzas',
  },
});

// Export logger instance
export { logger };

// Export typed logger methods
export const log = {
  fatal: logger.fatal.bind(logger),
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  trace: logger.trace.bind(logger),
};

// Child logger factory
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

// Request logger middleware for Next.js
export function withRequestLogger(handler: Function) {
  return async function (request: Request, ...args: any[]) {
    const requestId = randomUUID();
    const startTime = Date.now();
    
    const requestLogger = logger.child({
      requestId,
      method: request.method,
      url: request.url,
    });
    
    try {
      requestLogger.info('Request started');
      // @ts-ignore - Add logger to request context if needed
      request.logger = requestLogger;
      const response = await handler(request, ...args);
      const duration = Date.now() - startTime;
      requestLogger.info({ duration }, 'Request completed');
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      requestLogger.error({ duration, error }, 'Request failed');
      throw error;
    }
  };
}