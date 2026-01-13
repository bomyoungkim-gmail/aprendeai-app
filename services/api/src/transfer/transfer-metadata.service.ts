import { Injectable, Inject } from "@nestjs/common";
import { ExtractMetadataUseCase } from "./application/use-cases/extract-metadata.use-case";
import {
  ITransferMetadataRepository,
  TransferMetadataEntity,
} from "./domain/transfer-metadata.repository.interface";
import { ExtractMetadataResult } from "./application/types/transfer-metadata.types";

@Injectable()
export class TransferMetadataService {
  constructor(
    @Inject(ITransferMetadataRepository)
    private readonly repository: ITransferMetadataRepository,
    private readonly extractMetadataUseCase: ExtractMetadataUseCase,
  ) {}

  async getMetadata(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
  }): Promise<TransferMetadataEntity | null> {
    return await this.repository.findByContentAndChunk(params);
  }

  async extractAndStore(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
    familyId?: string;
    institutionId?: string;
    userId?: string;
    fallbackConfig?: {
      allowLLM: boolean;
      caps?: { maxTokens: number; modelTier: string };
      phase?: "DURING" | "POST";
    };
  }): Promise<ExtractMetadataResult> {
    return await this.extractMetadataUseCase.execute(params);
  }

  async getAllForContent(
    contentId: string,
    scopeType: string,
  ): Promise<TransferMetadataEntity[]> {
    return await this.repository.findManyByContent(contentId, scopeType);
  }
}
