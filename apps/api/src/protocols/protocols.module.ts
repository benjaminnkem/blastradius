import { Module } from "@nestjs/common";
import { ProtocolsController } from "./protocols.controller.js";

@Module({
  controllers: [ProtocolsController],
})
export class ProtocolsModule {}
