import { Module } from "@nestjs/common";
import { MethodsController } from "./methods.controller.js";

@Module({
  controllers: [MethodsController],
})
export class MethodsModule {}
