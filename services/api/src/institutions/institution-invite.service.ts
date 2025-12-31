import { Injectable, Inject } from "@nestjs/common";
import { InstitutionInviteUseCase } from "./application/use-cases/institution-invite.use-case";
import { IInvitesRepository } from "./domain/invites.repository.interface";
import { CreateInviteDto } from "./dto/institution.dto";

@Injectable()
export class InstitutionInviteService {
  constructor(
    private readonly inviteUseCase: InstitutionInviteUseCase,
    @Inject(IInvitesRepository) private readonly repository: IInvitesRepository,
  ) {}

  async create(institutionId: string, dto: CreateInviteDto, invitedBy: string) {
    return this.inviteUseCase.create(institutionId, dto, invitedBy);
  }

  async validate(token: string) {
    return this.inviteUseCase.validate(token);
  }

  async markAsUsed(inviteId: string) {
    return this.repository.update(inviteId, { usedAt: new Date() });
  }

  async findByInstitution(institutionId: string) {
    return this.repository.findByInstitution(institutionId);
  }

  async findByToken(token: string) {
      return this.inviteUseCase.validate(token);
  }

  async delete(inviteId: string, deletedBy: string) {
      await this.repository.delete(inviteId);
      return { message: "Invite cancelled successfully" };
  }
}
