import { Module } from "@nestjs/common";
import { IncidentsController } from "./incidents.controller.js";

@Module({
  controllers: [IncidentsController],
})
export class IncidentsModule {}
