import { Injectable, Inject } from '@nestjs/common';
import { ISharingRepository } from '../../domain/interfaces/sharing.repository.interface';

@Injectable()
export class RevokeAnnotationShareUseCase {
  constructor(
    @Inject(ISharingRepository) private readonly sharingRepo: ISharingRepository,
  ) {}

  async execute(annotationId: string, contextType: string, contextId: string): Promise<void> {
    await this.sharingRepo.revokeAnnotationShare(annotationId, contextType, contextId);
  }
}
