import { type AppEnv, loadEnv } from "./env.js";

export interface ArkivRuntimeConfig {
  networkName?: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl?: string;
  requestTimeoutMs: number;
  readMaxRetries: number;
  queryPageSize: number;
  queryMaxPages: number;
  healthAssertionTtlSec: number;
}

export function getArkivRuntimeConfig(env: AppEnv = loadEnv()): ArkivRuntimeConfig | null {
  if (!env.ARKIV_RPC_URL || env.ARKIV_CHAIN_ID === undefined) {
    return null;
  }
  return {
    networkName: env.ARKIV_NETWORK_NAME,
    chainId: env.ARKIV_CHAIN_ID,
    rpcUrl: env.ARKIV_RPC_URL,
    explorerUrl: env.ARKIV_EXPLORER_URL,
    requestTimeoutMs: env.ARKIV_REQUEST_TIMEOUT_MS,
    readMaxRetries: env.ARKIV_READ_MAX_RETRIES,
    queryPageSize: env.ARKIV_QUERY_PAGE_SIZE,
    queryMaxPages: env.ARKIV_QUERY_MAX_PAGES,
    healthAssertionTtlSec: env.ARKIV_HEALTH_ASSERTION_TTL_SEC,
  };
}

export interface RedisRuntimeConfig {
  url: string;
  tlsRejectUnauthorized: boolean;
  bullmqPrefix: string;
  cacheDefaultTtlSec: number;
}

export function getRedisRuntimeConfig(env: AppEnv = loadEnv()): RedisRuntimeConfig | null {
  if (!env.REDIS_URL) {
    return null;
  }
  return {
    url: env.REDIS_URL,
    tlsRejectUnauthorized: env.REDIS_TLS_REJECT_UNAUTHORIZED,
    bullmqPrefix: env.BULLMQ_PREFIX,
    cacheDefaultTtlSec: env.CACHE_DEFAULT_TTL_SEC,
  };
}

export interface ApiRuntimeConfig {
  host: string;
  port: number;
  publicBaseUrl?: string;
  corsOrigins: string[];
  rateLimitWindowSec: number;
  rateLimitMax: number;
  requestBodyLimit: string;
  shutdownGraceMs: number;
}

export function getApiRuntimeConfig(env: AppEnv = loadEnv()): ApiRuntimeConfig {
  const corsOrigins =
    env.CORS_ALLOWED_ORIGINS === "*"
      ? ["*"]
      : env.CORS_ALLOWED_ORIGINS.split(",")
          .map((s) => s.trim())
          .filter(Boolean);

  const port = env.PORT ?? env.API_PORT;
  const host = env.HOST ?? env.API_HOST ?? "0.0.0.0";

  return {
    host,
    port,
    publicBaseUrl: env.API_PUBLIC_BASE_URL,
    corsOrigins,
    rateLimitWindowSec: env.API_RATE_LIMIT_WINDOW_SEC,
    rateLimitMax: env.API_RATE_LIMIT_MAX,
    requestBodyLimit: env.API_REQUEST_BODY_LIMIT,
    shutdownGraceMs: env.API_SHUTDOWN_GRACE_MS,
  };
}

export interface GraphLimitsConfig {
  maxDepth: number;
  maxNodes: number;
  maxEdges: number;
  maxPaths: number;
  topPathsPerOperation: number;
  deadlineMs: number;
}

export function getGraphLimitsConfig(env: AppEnv = loadEnv()): GraphLimitsConfig {
  return {
    maxDepth: env.GRAPH_MAX_DEPTH,
    maxNodes: env.GRAPH_MAX_NODES,
    maxEdges: env.GRAPH_MAX_EDGES,
    maxPaths: env.GRAPH_MAX_PATHS,
    topPathsPerOperation: env.GRAPH_TOP_PATHS_PER_OPERATION,
    deadlineMs: env.GRAPH_DEADLINE_MS,
  };
}

export interface WorkerRuntimeConfig {
  concurrency: number;
  attempts: number;
  backoffMs: number;
  healthPort: number;
}

export function getWorkerRuntimeConfig(env: AppEnv = loadEnv()): WorkerRuntimeConfig {
  return {
    concurrency: env.MONITOR_WORKER_CONCURRENCY,
    attempts: env.MONITOR_JOB_ATTEMPTS,
    backoffMs: env.MONITOR_JOB_BACKOFF_MS,
    healthPort: env.MONITOR_HEALTH_PORT,
  };
}
