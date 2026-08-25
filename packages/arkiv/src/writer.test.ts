import { describe, expect, it } from "vitest";
import type { ArkivRuntimeConfig } from "@blastradius/config";
import { HealthAssertionCannotBeExtendedError } from "./errors.js";
import { ArkivWriter } from "./writer.js";

describe("ArkivWriter", () => {
  const config: ArkivRuntimeConfig = {
    chainId: 7733102,
    rpcUrl: "https://rpc.example.org",
    requestTimeoutMs: 5000,
    readMaxRetries: 2,
    queryPageSize: 50,
    queryMaxPages: 10,
    healthAssertionTtlSec: 300,
  };

  it("hard-refuses to extend HealthAssertion entities", async () => {
    const writer = new ArkivWriter(config);
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";

    await expect(
      writer.extendEntity(
        {
          entityKey: "0xdeadbeef",
          kind: "health_assertion",
          expiresInSec: 300,
        },
        privateKey,
      ),
    ).rejects.toThrow(HealthAssertionCannotBeExtendedError);
  });
});
