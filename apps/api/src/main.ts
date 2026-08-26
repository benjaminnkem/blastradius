import "reflect-metadata";
import { getApiRuntimeConfig } from "@blastradius/config";
import { createLogger } from "@blastradius/observability";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { GlobalHttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";

async function bootstrap(): Promise<void> {
  const config = getApiRuntimeConfig();
  const logger = createLogger({ service: "api" });

  const app = await NestFactory.create(AppModule, { logger: false });

  // 1. Prefix and Route configuration
  app.setGlobalPrefix("api/v1", {
    exclude: ["health/live", "health/ready"],
  });

  // 2. Global Filters and Interceptors
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. CORS
  app.enableCors({
    origin: config.corsOrigins.includes("*") ? true : config.corsOrigins,
    credentials: true,
  });

  // 4. OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle("BlastRadius Public API")
    .setDescription(
      "Cryptographically verified DeFi dependency graph & blast radius intelligence platform backed by Arkiv.",
    )
    .setVersion("1.0.0")
    .addTag("Incidents", "Active dependency incidents and blast radius impact")
    .addTag("Dependencies", "Dependency graph nodes and current health state")
    .addTag("Blast Radius", "Cycle-safe BFS blast radius exposure traversal")
    .addTag("Protocols", "Protocol-level exposure aggregation")
    .addTag("Proof & Provenance", "Arkiv on-chain entity verification and proof")
    .addTag("Monitoring Methods", "Methodology parameters and check rules")
    .addTag("Health Probes", "Liveness and readiness checks")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document);

  // 5. Graceful Shutdown
  app.enableShutdownHooks();

  await app.listen(config.port, config.host);
  logger.info(
    {
      host: config.host,
      port: config.port,
      swaggerUrl: `http://${config.host}:${config.port}/api/docs`,
    },
    "BlastRadius API server is listening and ready to serve traffic",
  );
}

bootstrap().catch((error: unknown) => {
  console.error("API bootstrap failed:", error);
  process.exit(1);
});
