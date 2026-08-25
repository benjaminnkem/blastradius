#!/usr/bin/env node
import { Command } from "commander";
import { formatStatus } from "./status";

const program = new Command();

program
  .name("blastradius")
  .description("BlastRadius publisher CLI (Phase 0 scaffold — no Arkiv writes)")
  .version("0.0.0");

program
  .command("status")
  .description("Show CLI scaffold status. Does not write to Arkiv.")
  .action(() => {
    process.stdout.write(`${formatStatus()}\n`);
  });

program.parse();
