import pino, { type Logger } from "pino";

export type { Logger };

export const REDACT_PATHS = [
  "privateKey",
  "PRIVATE_KEY",
  "ARKIV_MONITOR_PRIVATE_KEY",
  "ARKIV_CURATOR_PRIVATE_KEY",
  "ARKIV_PROTOCOL_PRIVATE_KEY",
  "req.headers.authorization",
  "headers.authorization",
  "*.password",
  "*.secret",
  "*.apiKey",
  "*.token",
] as const;

export function createLogger(options: { service: string; level?: string }): Logger {
  return pino({
    name: options.service,
    level: options.level ?? "info",
    redact: {
      paths: [...REDACT_PATHS],
      censor: "[REDACTED]",
    },
  });
}
