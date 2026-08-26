import { Global, Module } from "@nestjs/common";
import { ArkivService } from "./arkiv.service.js";

@Global()
@Module({
  providers: [ArkivService],
  exports: [ArkivService],
})
export class ArkivModule {}
