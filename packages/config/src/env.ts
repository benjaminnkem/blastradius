import { z } from "zod";

export const NODE_ENVS = ["development", "test", "production"] as const;
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export const DEFAULT_PROJECT_NAMESPACE = "blastradius-v1";

const emptyToUndefined = (value: unknown): unknown =>
  value === "" || value === undefined ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.url().optional());
const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional());

export const envSchema = z
  .object({
    NODE_ENV: z.enum(NODE_ENVS).default("development"),
    LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
    BLASTRADIUS_PROJECT: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, "BLASTRADIUS_PROJECT must be lowercase alphanumeric with hyphens")
      .default(DEFAULT_PROJECT_NAMESPACE),
    APP_VERSION: optionalNonEmptyString,
    ARKIV_RPC_URL: optionalUrl,
    ARKIV_CHAIN_ID: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    ARKIV_NETWORK_NAME: optionalNonEmptyString,
    ARKIV_EXPLORER_URL: optionalUrl,
    REDIS_URL: optionalNonEmptyString,
    API_HOST: z.string().min(1).default("127.0.0.1"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    MONITOR_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  })
  .superRefine((value, ctx) => {
    const hasRpc = value.ARKIV_RPC_URL !== undefined;
    const hasChainId = value.ARKIV_CHAIN_ID !== undefined;
    if (hasRpc !== hasChainId) {
      ctx.addIssue({
        code: "custom",
        message:
          "Invalid configuration: ARKIV_CHAIN_ID is required when ARKIV_RPC_URL is set, and ARKIV_RPC_URL is required when ARKIV_CHAIN_ID is set.",
      });
    }
  });

export type AppEnv = z.infer<typeof envSchema>;

export class ConfigError extends Error {
  readonly code = "CONFIG_INVALID";

  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export function loadEnv(source: NodeJS.Dict<string> = process.env): AppEnv {
  const result = envSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new ConfigError(`Invalid configuration:\n${details}`);
  }
  return result.data;
}
