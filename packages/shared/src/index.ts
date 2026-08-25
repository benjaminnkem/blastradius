export const PACKAGE_NAME = "@blastradius/shared" as const;
export const IMPLEMENTATION_PHASE = 0 as const;

export type HealthCheckState = "ok" | "unconfigured" | "unavailable" | "error";

export interface LiveProbe {
  status: "ok";
}

export interface ReadyProbe {
  status: "ok" | "not_ready" | "error";
  reason?: string;
  checks: Record<string, HealthCheckState>;
}
