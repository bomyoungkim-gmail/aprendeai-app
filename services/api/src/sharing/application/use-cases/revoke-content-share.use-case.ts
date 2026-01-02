import { Injectable, Inject } from "@nestjs/common";
import { ISharingRepository } from "../../domain/interfaces/sharing.repository.interface";

@Injectable()
export class RevokeContentShareUseCase {
  constructor(
    @Inject(ISharingRepository)
    private readonly sharingRepo: ISharingRepository,
  ) {}

  async execute(
    contentId: string,
    contextType: string,
    contextId: string,
  ): Promise<void> {
    // TODO: Ownership check (from original service TODO)
    await this.sharingRepo.revokeContentShare(
      contentId,
      contextType,
      contextId,
    );
  }
}
