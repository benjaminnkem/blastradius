import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@blastradius/config";
import { createLogger } from "@blastradius/observability";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({ service: "monitor", level: env.LOG_LEVEL });
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(env.MONITOR_HEALTH_PORT, env.API_HOST);
  logger.info(
    { host: env.API_HOST, port: env.MONITOR_HEALTH_PORT, phase: 0 },
    "monitor scaffold listening; observation and publication are not implemented",
  );
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
