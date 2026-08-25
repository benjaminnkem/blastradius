import { createPublicClient, createWalletClient } from "@arkiv-network/sdk";
import type { ArkivRuntimeConfig } from "@blastradius/config";
import { type Chain, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { ArkivValidationError } from "./errors.js";

/**
 * Constructs a custom viem Chain definition dynamically from runtime configuration.
 * Invariant: Never hardcodes retired chains or network constants.
 */
export function createArkivChain(config: ArkivRuntimeConfig): Chain {
  if (!config.chainId || !config.rpcUrl) {
    throw new ArkivValidationError(
      "Cannot create Arkiv chain: chainId and rpcUrl are required in ArkivRuntimeConfig.",
    );
  }

  return defineChain({
    id: config.chainId,
    name: config.networkName ?? `Arkiv-${config.chainId}`,
    nativeCurrency: { name: "Arkiv Gas", symbol: "GAS", decimals: 18 },
    rpcUrls: {
      default: { http: [config.rpcUrl] },
    },
    blockExplorers: config.explorerUrl
      ? { default: { name: "Arkiv Explorer", url: config.explorerUrl } }
      : undefined,
  });
}

/**
 * Creates an Arkiv PublicClient for executing read queries and getting entities.
 */
export function createArkivPublicClient(config: ArkivRuntimeConfig) {
  const chain = createArkivChain(config);
  return createPublicClient({
    chain,
    transport: http(config.rpcUrl, {
      timeout: config.requestTimeoutMs,
      retryCount: config.readMaxRetries,
    }),
  });
}

export type ArkivPublicClient = ReturnType<typeof createArkivPublicClient>;

/**
 * Creates an Arkiv WalletClient for signing and broadcasting entity writes.
 */
export function createArkivWalletClient(config: ArkivRuntimeConfig, privateKey: string) {
  if (!privateKey) {
    throw new ArkivValidationError("Private key is required to create an Arkiv WalletClient.");
  }
  const chain = createArkivChain(config);
  const normalizedKey = (
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  ) as `0x${string}`;

  const account = privateKeyToAccount(normalizedKey);

  return createWalletClient({
    chain,
    transport: http(config.rpcUrl, {
      timeout: config.requestTimeoutMs,
    }),
    account,
  });
}

export type ArkivWalletClient = ReturnType<typeof createArkivWalletClient>;
