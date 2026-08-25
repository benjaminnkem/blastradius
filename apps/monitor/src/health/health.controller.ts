import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { getRedisRuntimeConfig } from "@blastradius/config";
import { createRedisClient, pingRedis } from "@blastradius/monitoring";
import type { LiveProbe, ReadyProbe } from "@blastradius/shared";

@Controller("health")
export class HealthController {
  @Get("live")
  live(): LiveProbe {
    return { status: "ok" };
  }

  @Get("ready")
  async ready(): Promise<ReadyProbe> {
    const redisConfig = getRedisRuntimeConfig();
    if (!redisConfig) {
      const body: ReadyProbe = {
        status: "not_ready",
        reason: "redis_unconfigured",
        checks: {
          redis: "unconfigured",
          scheduler: "unconfigured",
        },
      };
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }

    try {
      const client = createRedisClient(redisConfig);
      const isReachable = await pingRedis(client, 1000);
      await client.quit().catch(() => {});

      if (!isReachable) {
        const body: ReadyProbe = {
          status: "not_ready",
          reason: "redis_unavailable",
          checks: {
            redis: "unavailable",
            scheduler: "unavailable",
          },
        };
        throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return {
        status: "ok",
        checks: {
          redis: "ok",
          scheduler: "ok",
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const body: ReadyProbe = {
        status: "error",
        reason: "redis_check_failed",
        checks: {
          redis: "error",
          scheduler: "error",
        },
      };
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }
  }
}
