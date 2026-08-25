/**
 * Isolation boundary for @arkiv-network/sdk.
 *
 * Phase 0 pins the SDK dependency but does not construct clients, import
 * chain constants, or talk to a network. Phase 2 implements the adapter
 * against runtime-configured RPC/chain ID only.
 */
export const PACKAGE_NAME = "@blastradius/arkiv" as const;
export const ARKIV_ADAPTER_STATUS = "not_implemented" as const;
export const IMPLEMENTATION_PHASE = 0 as const;

export function isArkivAdapterImplemented(): boolean {
  return ARKIV_ADAPTER_STATUS === "implemented";
}
