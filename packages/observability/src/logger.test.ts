import { describe, expect, it } from "vitest";
import { createLogger, REDACT_PATHS } from "./logger";

describe("createLogger", () => {
  it("redacts private key field names", () => {
    expect(REDACT_PATHS).toContain("ARKIV_MONITOR_PRIVATE_KEY");
    const logger = createLogger({ service: "test", level: "silent" });
    expect(logger.bindings().name).toBe("test");
  });
});
