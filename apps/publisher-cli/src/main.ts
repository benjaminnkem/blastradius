#!/usr/bin/env node
import { join } from "node:path";
import { getArkivRuntimeConfig, loadDependencyDeclarationsDir } from "@blastradius/config";
import { Command } from "commander";
import { computeGraphDiff } from "./commands/diff.js";
import { validateDeclarations } from "./commands/validate.js";
import { formatStatus } from "./status.js";

const program = new Command();

program
  .name("blastradius")
  .description("BlastRadius Publisher & Verification CLI")
  .version("0.1.0");

program
  .command("status")
  .description("Show publisher CLI runtime configuration and network info")
  .action(() => {
    process.stdout.write(`${formatStatus()}\n`);
  });

program
  .command("validate")
  .description("Validate local YAML/JSON declaration files in config/")
  .option("-c, --config-dir <path>", "Path to config directory", "config")
  .action((options) => {
    const configDir = join(process.cwd(), options.configDir);
    const result = validateDeclarations(configDir);

    if (result.valid) {
      process.stdout.write(`✓ All ${result.fileCount} declaration files are valid!\n`);
    } else {
      process.stderr.write(`✗ Validation failed with ${result.errors.length} errors:\n`);
      for (const err of result.errors) {
        process.stderr.write(`  - ${err.file}: ${err.error}\n`);
      }
      process.exit(1);
    }
  });

program
  .command("diff")
  .description("Diff local dependency declarations against active Arkiv edges")
  .option("-c, --config-dir <path>", "Path to config directory", "config/dependencies")
  .action((options) => {
    const depDir = join(process.cwd(), options.configDir);
    const declarations = loadDependencyDeclarationsDir(depDir);
    const diff = computeGraphDiff(declarations, []);

    process.stdout.write(`Found ${diff.items.length} edge declarations:\n`);
    for (const item of diff.items) {
      process.stdout.write(`  [${item.action}] ${item.edgeId} -> v${item.targetVersion}\n`);
    }
  });

program
  .command("publish")
  .description("Publish dependency declarations to Arkiv")
  .option("-c, --config-dir <path>", "Path to config directory", "config/dependencies")
  .option("--dry-run", "Validate and preview without publishing", false)
  .action(async (options) => {
    const depDir = join(process.cwd(), options.configDir);
    const declarations = loadDependencyDeclarationsDir(depDir);

    for (const decl of declarations) {
      if (options.dryRun) {
        process.stdout.write(`[DRY-RUN] Validated edge ${decl.edgeId}\n`);
      } else {
        process.stdout.write(`Publishing edge ${decl.edgeId} (requires live writer)...\n`);
      }
    }
  });

program
  .command("inspect")
  .description("Inspect an Arkiv entity by key")
  .argument("<key>", "Entity key (0x...)")
  .action(async (key) => {
    try {
      const config = getArkivRuntimeConfig();
      if (config) {
        process.stdout.write(
          `Querying entity ${key} on chain ${config.chainId} (${config.networkName ?? "custom"})...\n`,
        );
      } else {
        process.stdout.write(`Querying entity ${key}...\n`);
      }
    } catch (err) {
      process.stderr.write(`Inspect error: ${err instanceof Error ? err.message : String(err)}\n`);
    }
  });

program.parse();
