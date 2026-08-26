import { describe, expect, it, vi } from "vitest";
import type { ArkivWriter } from "@blastradius/arkiv";
import type { DependencyDeclarationFile } from "@blastradius/schemas";
import { publishDependencyDeclaration } from "./commands/publish.js";

describe("Publisher CLI: publish command", () => {
  const dummyKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const localDeclaration: DependencyDeclarationFile = {
    schemaVersion: 1,
    edgeId: "base-aave-v3-vault-usdc-to-chainlink-oracle",
    dependent: { id: "aave:vault:usdc", type: "vault" },
    dependency: { id: "chainlink:usdc-usd:8453", type: "oracle" },
    criticalityBps: 10000,
    propagationBps: 10000,
    sourceKind: "curator",
    evidence: [{ type: "official_docs", url: "https://docs.aave.com" }],
  };

  it("handles dry-run mode without publishing to Arkiv", async () => {
    const mockWriter = {
      publishDependencyEdge: vi.fn(),
    } as unknown as ArkivWriter;

    const result = await publishDependencyDeclaration(localDeclaration, mockWriter, dummyKey, 1, {
      dryRun: true,
    });

    expect(result.dryRun).toBe(true);
    expect(result.edgeId).toBe("base-aave-v3-vault-usdc-to-chainlink-oracle");
    expect(mockWriter.publishDependencyEdge).not.toHaveBeenCalled();
  });

  it("publishes to Arkiv when not dry-run", async () => {
    const mockWriter = {
      publishDependencyEdge: vi.fn().mockResolvedValue({
        entityKey: "0xentity-edge-123",
        txHash: "0xtx-edge-123",
        creator: "0x1111111111111111111111111111111111111111",
        expiresInSec: 31536000,
      }),
    } as unknown as ArkivWriter;

    const result = await publishDependencyDeclaration(localDeclaration, mockWriter, dummyKey, 1, {
      dryRun: false,
    });

    expect(result.dryRun).toBe(false);
    expect(result.entityKey).toBe("0xentity-edge-123");
    expect(mockWriter.publishDependencyEdge).toHaveBeenCalledTimes(1);
  });
});
