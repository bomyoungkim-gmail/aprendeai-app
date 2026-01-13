import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { TransferMetadataService } from "./transfer-metadata.service";
import {
  BuildTransferMetadataDto,
  GetTransferMetadataDto,
} from "./application/dto/transfer-metadata.dto";
import { QueueService } from "../queue/queue.service";

@ApiTags("transfer")
@Controller("transfer/metadata")
export class TransferMetadataController {
  constructor(
    private readonly transferMetadataService: TransferMetadataService,
    private readonly queueService: QueueService,
  ) {}

  @Post("build")
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: "Enqueue transfer metadata build job" })
  @ApiResponse({
    status: 202,
    description: "Job enqueued successfully",
  })
  async buildMetadata(@Body() dto: BuildTransferMetadataDto) {
    // Enqueue background job
    await this.queueService.add("TRANSFER_METADATA_BUILD", {
      contentId: dto.contentId,
      scopeType: dto.scopeType,
      familyId: dto.familyId,
      institutionId: dto.institutionId,
    });

    return {
      message: "Transfer metadata build job enqueued",
      contentId: dto.contentId,
    };
  }

  @Get()
  @ApiOperation({ summary: "Get transfer metadata for a chunk" })
  @ApiResponse({
    status: 200,
    description: "Metadata retrieved successfully",
  })
  async getMetadata(@Query() dto: GetTransferMetadataDto) {
    const metadata = await this.transferMetadataService.getMetadata({
      contentId: dto.contentId,
      chunkId: dto.chunkId,
      chunkIndex: dto.chunkIndex,
      pageNumber: dto.pageNumber,
      scopeType: dto.scopeType,
    });

    if (!metadata) {
      // Fallback: generate on-the-fly if not found
      return await this.transferMetadataService.extractAndStore({
        contentId: dto.contentId,
        chunkId: dto.chunkId,
        chunkIndex: dto.chunkIndex,
        pageNumber: dto.pageNumber,
        scopeType: dto.scopeType,
      });
    }

    return metadata;
  }
}
