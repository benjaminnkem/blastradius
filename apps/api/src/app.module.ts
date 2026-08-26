import { type MiddlewareConsumer, Module, type NestModule } from "@nestjs/common";
import { ArkivModule } from "./arkiv/arkiv.module.js";
import { BlastRadiusModule } from "./blast-radius/blast-radius.module.js";
import { CorrelationIdMiddleware } from "./common/middleware/correlation-id.middleware.js";
import { DependenciesModule } from "./dependencies/dependencies.module.js";
import { GraphModule } from "./graph/graph.module.js";
import { HealthModule } from "./health/health.module.js";
import { IncidentsModule } from "./incidents/incidents.module.js";
import { MethodsModule } from "./methods/methods.module.js";
import { ProofModule } from "./proof/proof.module.js";
import { ProtocolsModule } from "./protocols/protocols.module.js";
import { TrustModule } from "./trust/trust.module.js";

@Module({
  imports: [
    ArkivModule,
    TrustModule,
    GraphModule,
    HealthModule,
    IncidentsModule,
    DependenciesModule,
    BlastRadiusModule,
    ProtocolsModule,
    ProofModule,
    MethodsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes("*");
  }
}
