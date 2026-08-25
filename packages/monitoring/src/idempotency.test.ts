import { describe, expect, it } from "vitest";
import { generateObservationId } from "./pipeline/idempotency.js";

describe("generateObservationId", () => {
  it("produces deterministic hash independent of measurement key ordering", () => {
    const id1 = generateObservationId({
      dependencyId: "sequencer:base",
      methodId: "sequencer-health-v1",
      methodVersion: 1,
      observedAt: 1700000000,
      measurements: {
        latencyMs: 120,
        lagSec: 2,
        blockNumber: 1234567,
      },
    });

    const id2 = generateObservationId({
      dependencyId: "sequencer:base",
      methodId: "sequencer-health-v1",
      methodVersion: 1,
      observedAt: 1700000000,
      measurements: {
        blockNumber: 1234567,
        lagSec: 2,
        latencyMs: 120,
      },
    });

    expect(id1.startsWith("sha256:")).toBe(true);
    expect(id1).toBe(id2);
  });

  it("produces distinct hashes for different timestamps or measurements", () => {
    const id1 = generateObservationId({
      dependencyId: "sequencer:base",
      methodId: "sequencer-health-v1",
      methodVersion: 1,
      observedAt: 1700000000,
      measurements: { lagSec: 2 },
    });

    const id2 = generateObservationId({
      dependencyId: "sequencer:base",
      methodId: "sequencer-health-v1",
      methodVersion: 1,
      observedAt: 1700000010, // different timestamp
      measurements: { lagSec: 2 },
    });

    expect(id1).not.toBe(id2);
  });
});
