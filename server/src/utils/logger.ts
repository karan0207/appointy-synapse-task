// Goal: Provide simple logging utility for the application
// Centralizes console logging with timestamp and level

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const formatMessage = (level: LogLevel, message: string, meta?: unknown): string => {
  const timestamp = getTimestamp();
  const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(formatMessage('info', message, meta));
  },

  warn: (message: string, meta?: unknown) => {
    console.warn(formatMessage('warn', message, meta));
  },

  error: (message: string, error?: unknown) => {
    const errorMeta = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error;
    console.error(formatMessage('error', message, errorMeta));
  },

  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

