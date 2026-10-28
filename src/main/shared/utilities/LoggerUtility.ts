import pino, { type Logger } from 'pino';

const rootLogger = pino(
  {
    level: process.env['LOG_LEVEL']?.toLowerCase() ?? 'info',
    messageKey: 'message',
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      bindings: () => ({}),
      level: (label) => ({ level: label.toUpperCase() })
    }
  },
  pino.destination({ dest: 1, sync: true })
);

export function getLogger(loggerName: string): Logger {
  return rootLogger.child({ loggerName });
}
