import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { loadEnv } from "@blastradius/config";
import { createLogger } from "@blastradius/observability";
import { AppModule } from "./app.module.js";

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const logger = createLogger({ service: "api", level: env.LOG_LEVEL });
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(env.API_PORT, env.API_HOST);
  logger.info(
    { host: env.API_HOST, port: env.API_PORT, phase: 0 },
    "api scaffold listening; product routes are not implemented",
  );
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
