import { describe, expect, it } from "vitest";
import { createChildLogger, createLogger, REDACT_PATHS } from "./logger.js";

describe("Observability Logger", () => {
  it("creates a logger with configured service name", () => {
    const logger = createLogger({ service: "test-service" });
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
  });

  it("includes sensitive keys in REDACT_PATHS", () => {
    expect(REDACT_PATHS).toContain("privateKey");
    expect(REDACT_PATHS).toContain("headers.authorization");
    expect(REDACT_PATHS).toContain("*.apiKey");
  });

  it("creates child logger with correlation ID context", () => {
    const parent = createLogger({ service: "parent" });
    const child = createChildLogger(parent, {
      correlationId: "corr-123",
      observationId: "obs-456",
    });
    expect(child).toBeDefined();
    expect(typeof child.info).toBe("function");
  });
});
