import { describe, expect, it } from "vitest";
import type { ArkivRuntimeConfig } from "@blastradius/config";
import { createArkivChain, createArkivPublicClient, createArkivWalletClient } from "./client.js";
import { ArkivValidationError } from "./errors.js";

describe("Arkiv Client Factory", () => {
  const validConfig: ArkivRuntimeConfig = {
    networkName: "Arkiv-Devnet-Test",
    chainId: 7733102,
    rpcUrl: "https://rpc.example.org",
    explorerUrl: "https://explorer.example.org",
    requestTimeoutMs: 5000,
    readMaxRetries: 2,
    queryPageSize: 50,
    queryMaxPages: 10,
    healthAssertionTtlSec: 300,
  };

  it("dynamically defines a Chain without hardcoded constants", () => {
    const chain = createArkivChain(validConfig);
    expect(chain.id).toBe(7733102);
    expect(chain.name).toBe("Arkiv-Devnet-Test");
    expect(chain.rpcUrls.default.http[0]).toBe("https://rpc.example.org");
    expect(chain.blockExplorers?.default.url).toBe("https://explorer.example.org");
  });

  it("throws validation error if chainId or rpcUrl is missing", () => {
    expect(() =>
      createArkivChain({
        ...validConfig,
        rpcUrl: "",
      }),
    ).toThrow(ArkivValidationError);
  });

  it("creates a PublicClient with configured timeout", () => {
    const client = createArkivPublicClient(validConfig);
    expect(client).toBeDefined();
    expect(typeof client.getEntity).toBe("function");
    expect(typeof client.select).toBe("function");
  });

  it("creates a WalletClient with normalized private key account", () => {
    const privateKey = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const client = createArkivWalletClient(validConfig, privateKey);
    expect(client).toBeDefined();
    expect(client.account.address).toBeDefined();
    expect(typeof client.createEntity).toBe("function");
    expect(typeof client.extendEntity).toBe("function");
  });

  it("throws validation error if creating WalletClient without private key", () => {
    expect(() => createArkivWalletClient(validConfig, "")).toThrow(ArkivValidationError);
  });
});
