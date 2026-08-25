import { ArkivValidationError } from "./errors.js";

export interface ArkivAttribute {
  key: string;
  value: string | number;
}

/**
 * Converts a typed attributes object into the standard Arkiv attribute array.
 * Invariants:
 * 1. Numeric attributes MUST be integers.
 * 2. Undefined/null attributes are excluded.
 * 3. Boolean attributes are converted to string ("true" / "false").
 */
export function toArkivAttributes(attributes: Record<string, unknown>): ArkivAttribute[] {
  const result: ArkivAttribute[] = [];

  for (const [key, val] of Object.entries(attributes)) {
    if (val === undefined || val === null) {
      continue;
    }

    if (typeof val === "number") {
      if (!Number.isInteger(val)) {
        throw new ArkivValidationError(
          `Numeric Arkiv attribute '${key}' must be an integer, received float ${val}. Scale decimals to basis points or integers before saving.`,
        );
      }
      result.push({ key, value: val });
    } else if (typeof val === "boolean") {
      result.push({ key, value: val ? "true" : "false" });
    } else if (typeof val === "string") {
      result.push({ key, value: val });
    } else {
      result.push({ key, value: String(val) });
    }
  }

  return result;
}

/**
 * Converts Arkiv SDK attribute array back into a key-value record.
 */
export function fromArkivAttributes(
  attributes: readonly { key: string; value: string | number }[] | undefined,
): Record<string, string | number> {
  const record: Record<string, string | number> = {};
  if (!attributes) return record;

  for (const attr of attributes) {
    record[attr.key] = attr.value;
  }
  return record;
}
