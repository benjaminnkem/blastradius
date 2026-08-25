import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@blastradius/config";
import { createLogger } from "@blastradius/observability";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({ service: "monitor", level: env.LOG_LEVEL });
  const app = await NestFactory.create(AppModule, { logger: false });

  // Enable graceful shutdown hooks
  app.enableShutdownHooks();

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Received shutdown signal; closing monitor application...");
    try {
      await app.close();
      logger.info("Monitor application closed gracefully.");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during graceful shutdown");
      process.exit(1);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));

  await app.listen(env.MONITOR_HEALTH_PORT, env.API_HOST);
  logger.info(
    { host: env.API_HOST, port: env.MONITOR_HEALTH_PORT, phase: 4 },
    "monitor worker platform listening and ready for job queues",
  );
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
