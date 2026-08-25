export const CLI_STATUS = {
  name: "BlastRadius publisher CLI",
  phase: 0,
  writes: "disabled",
  message: "Phase 0 scaffold. Validation and Arkiv publish commands are not implemented.",
} as const;

export function formatStatus(): string {
  return [
    CLI_STATUS.name,
    `status: phase_${CLI_STATUS.phase}_scaffold`,
    `writes: ${CLI_STATUS.writes}`,
    CLI_STATUS.message,
  ].join("\n");
}
