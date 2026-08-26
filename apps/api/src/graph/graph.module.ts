import { Global, Module } from "@nestjs/common";
import { GraphService } from "./graph.service.js";

@Global()
@Module({
  providers: [GraphService],
  exports: [GraphService],
})
export class GraphModule {}
