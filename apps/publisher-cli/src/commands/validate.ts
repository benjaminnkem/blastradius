import { readdirSync } from "node:fs";
import { join } from "node:path";
import {
  loadDependencyDeclarationFile,
  loadMonitorTargetsFile,
  loadTrustPolicyFile,
} from "@blastradius/config";

export interface ValidationResult {
  valid: boolean;
  fileCount: number;
  errors: Array<{ file: string; error: string }>;
}

export function validateDeclarations(configDir: string): ValidationResult {
  const errors: Array<{ file: string; error: string }> = [];
  let fileCount = 0;

  // 1. Validate Trust Policies
  const trustDir = join(configDir, "trust");
  try {
    const trustFiles = readdirSync(trustDir).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"),
    );
    for (const f of trustFiles) {
      fileCount++;
      const fullPath = join(trustDir, f);
      try {
        loadTrustPolicyFile(fullPath);
      } catch (err) {
        errors.push({
          file: `trust/${f}`,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch {
    // Trust dir may not exist in some test runs
  }

  // 2. Validate Dependencies
  const depDir = join(configDir, "dependencies");
  try {
    const depFiles = readdirSync(depDir).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"),
    );
    for (const f of depFiles) {
      fileCount++;
      const fullPath = join(depDir, f);
      try {
        loadDependencyDeclarationFile(fullPath);
      } catch (err) {
        errors.push({
          file: `dependencies/${f}`,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch {
    // Dependencies dir may not exist
  }

  // 3. Validate Monitor Configs
  const monDir = join(configDir, "monitors");
  try {
    const monFiles = readdirSync(monDir).filter(
      (f) => f.endsWith(".yaml") || f.endsWith(".yml") || f.endsWith(".json"),
    );
    for (const f of monFiles) {
      fileCount++;
      const fullPath = join(monDir, f);
      try {
        loadMonitorTargetsFile(fullPath);
      } catch (err) {
        errors.push({
          file: `monitors/${f}`,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  } catch {
    // Monitors dir may not exist
  }

  return {
    valid: errors.length === 0,
    fileCount,
    errors,
  };
}
