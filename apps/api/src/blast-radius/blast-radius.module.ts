import { Module } from "@nestjs/common";
import { BlastRadiusController } from "./blast-radius.controller.js";

@Module({
  controllers: [BlastRadiusController],
})
export class BlastRadiusModule {}
