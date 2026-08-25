import pino, { type Logger, type LoggerOptions } from "pino";

export type { Logger };

export const REDACT_PATHS = [
  "privateKey",
  "PRIVATE_KEY",
  "ARKIV_MONITOR_PRIVATE_KEY",
  "ARKIV_CURATOR_PRIVATE_KEY",
  "ARKIV_PROTOCOL_PRIVATE_KEY",
  "req.headers.authorization",
  "headers.authorization",
  "authorization",
  "*.password",
  "*.secret",
  "*.apiKey",
  "*.token",
  "*.privateKey",
] as const;

export interface CreateLoggerOptions {
  service: string;
  level?: string;
  options?: LoggerOptions;
}

export function createLogger(options: CreateLoggerOptions): Logger {
  return pino({
    name: options.service,
    level: options.level ?? "info",
    redact: {
      paths: [...REDACT_PATHS],
      censor: "[REDACTED]",
    },
    ...options.options,
  });
}

/**
 * Creates a child logger with a correlation / observation / request ID context.
 */
export function createChildLogger(
  logger: Logger,
  context: { correlationId?: string; observationId?: string; [key: string]: unknown },
): Logger {
  return logger.child(context);
}
