import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { parse as parseYaml } from "yaml";
import {
  type DependencyDeclarationFile,
  DependencyDeclarationFileSchema,
  type MonitorMethodDeclarationFile,
  MonitorMethodDeclarationFileSchema,
  type MonitorTargetConfig,
  MonitorTargetsFileSchema,
  type TrustPolicy,
  TrustPolicySchema,
} from "@blastradius/schemas";
import { ConfigError } from "./env.js";

function parseRaw(raw: string | unknown): unknown {
  if (typeof raw === "string") {
    try {
      return parseYaml(raw);
    } catch (error) {
      throw new ConfigError(
        `YAML parse error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  return raw;
}

export function loadTrustPolicy(raw: string | unknown): TrustPolicy {
  const parsed = parseRaw(raw);
  const result = TrustPolicySchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "trustPolicy"}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid Trust Policy configuration:\n${details}`);
  }
  return result.data;
}

export function loadTrustPolicyFile(filePath: string): TrustPolicy {
  try {
    const content = readFileSync(filePath, "utf8");
    return loadTrustPolicy(content);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(
      `Could not read Trust Policy file at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function loadMonitorTargets(raw: string | unknown): MonitorTargetConfig[] {
  const parsed = parseRaw(raw);
  const result = MonitorTargetsFileSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "monitorTargets"}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid Monitor Targets configuration:\n${details}`);
  }
  return result.data.targets;
}

export function loadMonitorTargetsFile(filePath: string): MonitorTargetConfig[] {
  try {
    const content = readFileSync(filePath, "utf8");
    return loadMonitorTargets(content);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(
      `Could not read Monitor Targets file at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function loadDependencyDeclaration(raw: string | unknown): DependencyDeclarationFile {
  const parsed = parseRaw(raw);
  const result = DependencyDeclarationFileSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "declaration"}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid Dependency Declaration configuration:\n${details}`);
  }
  return result.data;
}

export function loadDependencyDeclarationFile(filePath: string): DependencyDeclarationFile {
  try {
    const content = readFileSync(filePath, "utf8");
    return loadDependencyDeclaration(content);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(
      `Could not read Dependency Declaration file at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function loadDependencyDeclarationsDir(dirPath: string): DependencyDeclarationFile[] {
  try {
    const entries = readdirSync(dirPath);
    const declarations: DependencyDeclarationFile[] = [];

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const stat = statSync(fullPath);
      if (stat.isFile()) {
        const ext = extname(entry).toLowerCase();
        if (ext === ".yaml" || ext === ".yml" || ext === ".json") {
          declarations.push(loadDependencyDeclarationFile(fullPath));
        }
      }
    }

    return declarations;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(
      `Could not read Dependency Declarations directory at ${dirPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function loadMonitorMethodDeclaration(raw: string | unknown): MonitorMethodDeclarationFile {
  const parsed = parseRaw(raw);
  const result = MonitorMethodDeclarationFileSchema.safeParse(parsed);
  if (!result.success) {
    const details = result.error.issues
      .map((i) => `${i.path.join(".") || "methodDeclaration"}: ${i.message}`)
      .join("\n");
    throw new ConfigError(`Invalid Monitor Method Declaration configuration:\n${details}`);
  }
  return result.data;
}

export function loadMonitorMethodDeclarationFile(filePath: string): MonitorMethodDeclarationFile {
  try {
    const content = readFileSync(filePath, "utf8");
    return loadMonitorMethodDeclaration(content);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(
      `Could not read Monitor Method Declaration file at ${filePath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
