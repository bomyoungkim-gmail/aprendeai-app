export interface ITransferMetadataRepository {
  upsert(metadata: TransferMetadataEntity): Promise<TransferMetadataEntity>;
  findByContentAndChunk(params: {
    contentId: string;
    chunkId?: string;
    chunkIndex?: number;
    pageNumber?: number;
    scopeType: string;
  }): Promise<TransferMetadataEntity | null>;
  findManyByContent(
    contentId: string,
    scopeType: string,
  ): Promise<TransferMetadataEntity[]>;
}

export interface TransferMetadataEntity {
  id: string;
  contentId: string;
  chunkId?: string | null;
  chunkIndex?: number | null;
  pageNumber?: number | null;
  anchorJson?: any;
  version: string;
  conceptJson: any;
  tier2Json: any[];
  analogiesJson: any[];
  domainsJson: any[];
  toolsJson: any;
  createdBy?: string | null;
  scopeType: string;
  familyId?: string | null;
  institutionId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const ITransferMetadataRepository = Symbol(
  "ITransferMetadataRepository",
);
