import { ArkivHistoricalQueryNotSupportedError } from "./errors.js";

/**
 * Feature gate for historical atBlock/validAtBlock queries.
 *
 * Current status: GATED.
 * The active network and SDK historical query APIs are awaiting live
 * integration verification before being promoted to production.
 */
export function isHistoricalQuerySupported(): false {
  return false;
}

export function listHealthAssertionsAtBlock(blockNumber: number): never {
  throw new ArkivHistoricalQueryNotSupportedError(blockNumber);
}
