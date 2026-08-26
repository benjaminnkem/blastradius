import { z } from "zod";

export const NODE_ENVS = ["development", "test", "production"] as const;
export const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
export const DEFAULT_PROJECT_NAMESPACE = "blastradius-v1";

const emptyToUndefined = (value: unknown): unknown =>
  value === "" || value === undefined ? undefined : value;

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalNonEmptyString = z.preprocess(emptyToUndefined, z.string().min(1).optional());
const booleanWithDefault = (defaultValue: boolean) =>
  z.preprocess((val) => {
    if (val === "" || val === undefined) return defaultValue;
    if (typeof val === "string") {
      if (val.toLowerCase() === "true" || val === "1") return true;
      if (val.toLowerCase() === "false" || val === "0") return false;
    }
    return val;
  }, z.boolean());

const optionalPrivateKey = z.preprocess(
  emptyToUndefined,
  z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Private key must be 0x followed by 64 hex characters")
    .optional(),
);

export const envSchema = z
  .object({
    // Shared / Identity
    NODE_ENV: z.enum(NODE_ENVS).default("development"),
    LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
    BLASTRADIUS_PROJECT: z
      .string()
      .min(1)
      .regex(/^[a-z0-9-]+$/, "BLASTRADIUS_PROJECT must be lowercase alphanumeric with hyphens")
      .refine((v) => !v.startsWith("0x"), {
        message:
          "BLASTRADIUS_PROJECT must not start with '0x' — check that a private key or address was not accidentally used",
      })
      .default(DEFAULT_PROJECT_NAMESPACE),
    APP_VERSION: optionalNonEmptyString,
    OTEL_SERVICE_NAME: optionalNonEmptyString,

    // Arkiv Network Configuration
    ARKIV_RPC_URL: optionalUrl,
    ARKIV_CHAIN_ID: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
    ARKIV_NETWORK_NAME: optionalNonEmptyString,
    ARKIV_EXPLORER_URL: optionalUrl,
    ARKIV_MONITOR_PRIVATE_KEY: optionalPrivateKey,
    ARKIV_CURATOR_PRIVATE_KEY: optionalPrivateKey,
    ARKIV_PROTOCOL_PRIVATE_KEY: optionalPrivateKey,
    ARKIV_REQUEST_TIMEOUT_MS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(10000),
    ),
    ARKIV_READ_MAX_RETRIES: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(0).default(3),
    ),
    ARKIV_QUERY_PAGE_SIZE: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(200).default(100),
    ),
    ARKIV_QUERY_MAX_PAGES: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(20),
    ),
    ARKIV_HEALTH_ASSERTION_TTL_SEC: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().max(3600).default(300),
    ),

    // Redis & BullMQ
    REDIS_URL: optionalNonEmptyString,
    REDIS_TLS_REJECT_UNAUTHORIZED: booleanWithDefault(true),
    BULLMQ_PREFIX: z.string().min(1).default("blastradius"),
    MONITOR_WORKER_CONCURRENCY: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(5),
    ),
    MONITOR_JOB_ATTEMPTS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(3),
    ),
    MONITOR_JOB_BACKOFF_MS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(1000),
    ),
    CACHE_DEFAULT_TTL_SEC: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(30),
    ),

    // API
    PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(65535).optional()),
    HOST: optionalNonEmptyString,
    API_HOST: z.string().min(1).default("0.0.0.0"),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    MONITOR_HEALTH_PORT: z.coerce.number().int().min(1).max(65535).default(3002),
    API_PUBLIC_BASE_URL: optionalUrl,
    CORS_ALLOWED_ORIGINS: z.string().default("*"),
    API_RATE_LIMIT_WINDOW_SEC: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(60),
    ),
    API_RATE_LIMIT_MAX: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(100),
    ),
    API_REQUEST_BODY_LIMIT: z.string().default("1mb"),
    API_SHUTDOWN_GRACE_MS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(5000),
    ),

    // Graph & Trust Limits
    GRAPH_MAX_DEPTH: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(10)),
    GRAPH_MAX_NODES: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(1000),
    ),
    GRAPH_MAX_EDGES: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(2000),
    ),
    GRAPH_MAX_PATHS: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().default(50)),
    GRAPH_TOP_PATHS_PER_OPERATION: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(3),
    ),
    GRAPH_DEADLINE_MS: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().positive().default(5000),
    ),
    TRUST_POLICY_PATH: optionalNonEmptyString,
    DEPENDENCY_DECLARATIONS_PATH: optionalNonEmptyString,
    MONITOR_TARGETS_PATH: optionalNonEmptyString,

    // Observability
    OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
    OTEL_EXPORTER_OTLP_HEADERS: optionalNonEmptyString,
    METRICS_ENABLED: booleanWithDefault(true),
    METRICS_PORT: z.preprocess(
      emptyToUndefined,
      z.coerce.number().int().min(1).max(65535).optional(),
    ),
    SENTRY_DSN: optionalUrl,

    // Public Web
    NEXT_PUBLIC_APP_ENV: optionalNonEmptyString,
    NEXT_PUBLIC_API_BASE_URL: optionalUrl,
    NEXT_PUBLIC_ARKIV_EXPLORER_URL: optionalUrl,
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
