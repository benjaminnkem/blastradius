import type { RedisRuntimeConfig, WorkerRuntimeConfig } from "@blastradius/config";
import {
  type Job,
  type Processor,
  Queue,
  type QueueOptions,
  Worker,
  type WorkerOptions,
} from "bullmq";
import { createRedisClient } from "../redis/client.js";

export const MONITOR_QUEUE_NAME = "monitor-observations" as const;

export interface MonitorJobData {
  targetId: string;
  dependencyId: string;
  triggerReason?: string;
}

/**
 * Creates the BullMQ Queue for scheduling monitor observation tasks.
 */
export function createMonitorQueue(
  redisConfig: RedisRuntimeConfig,
  workerConfig?: WorkerRuntimeConfig,
  options?: Partial<QueueOptions>,
): Queue<MonitorJobData> {
  const connection = createRedisClient(redisConfig);
  const prefix = redisConfig.bullmqPrefix ?? "blastradius";

  return new Queue<MonitorJobData>(MONITOR_QUEUE_NAME, {
    connection,
    prefix,
    defaultJobOptions: {
      attempts: workerConfig?.attempts ?? 3,
      backoff: {
        type: "exponential",
        delay: workerConfig?.backoffMs ?? 1000,
      },
      removeOnComplete: {
        count: 1000,
        age: 24 * 3600,
      },
      removeOnFail: {
        count: 5000,
        age: 7 * 24 * 3600,
      },
    },
    ...options,
  });
}

/**
 * Creates the BullMQ Worker for executing monitor observation jobs.
 */
export function createMonitorWorker(
  redisConfig: RedisRuntimeConfig,
  processor: Processor<MonitorJobData, void, string>,
  workerConfig?: WorkerRuntimeConfig,
  options?: Partial<WorkerOptions>,
): Worker<MonitorJobData, void, string> {
  const connection = createRedisClient(redisConfig);
  const prefix = redisConfig.bullmqPrefix ?? "blastradius";
  const concurrency = workerConfig?.concurrency ?? 5;

  return new Worker<MonitorJobData, void, string>(MONITOR_QUEUE_NAME, processor, {
    connection,
    prefix,
    concurrency,
    ...options,
  });
}

export type { Job };
