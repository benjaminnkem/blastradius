import { Global, Module } from "@nestjs/common";
import { TrustService } from "./trust.service.js";

@Global()
@Module({
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
