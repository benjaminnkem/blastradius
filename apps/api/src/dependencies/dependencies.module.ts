import { Module } from "@nestjs/common";
import { DependenciesController } from "./dependencies.controller.js";

@Module({
  controllers: [DependenciesController],
})
export class DependenciesModule {}
