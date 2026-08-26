import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { ArkivService } from "../arkiv/arkiv.service.js";

@ApiTags("Proof & Provenance")
@Controller("proof")
export class ProofController {
  constructor(private readonly arkivService: ArkivService) {}

  @Get(":entityKey")
  @ApiOperation({
    summary: "Get Arkiv on-chain entity proof",
    description:
      "Returns verified Arkiv entity provenance, creator address, attributes, and payload.",
  })
  @ApiParam({ name: "entityKey", description: "Arkiv entity key (0x...)" })
  @ApiResponse({ status: 200, description: "Arkiv entity proof" })
  async getEntityProof(@Param("entityKey") entityKey: string) {
    const entity = await this.arkivService.getEntity(entityKey);

    if (!entity) {
      throw new HttpException(
        `Arkiv entity '${entityKey}' was not found or has expired`,
        HttpStatus.NOT_FOUND,
      );
    }

    return entity;
  }
}
