import { Injectable, Inject } from "@nestjs/common";
import { IInstitutionsRepository } from "./domain/institutions.repository.interface";
import { GetInstitutionAdminDashboardUseCase } from "./application/use-cases/get-institution-admin-dashboard.use-case";
import { CreateInstitutionDto, UpdateInstitutionDto } from "./dto/institution.dto";
import { Institution } from "./domain/institution.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class InstitutionsService {
  constructor(
    @Inject(IInstitutionsRepository) private readonly repository: IInstitutionsRepository,
    private readonly getAdminDashboardUseCase: GetInstitutionAdminDashboardUseCase,
  ) {}

  async create(dto: CreateInstitutionDto) {
    const institution = new Institution({
      id: uuidv4(),
      ...dto,
    });
    return this.repository.create(institution);
  }

  findAll() {
    return this.repository.findAll();
  }

  findOne(id: string) {
    return this.repository.findById(id);
  }

  update(id: string, dto: UpdateInstitutionDto) {
    return this.repository.update(id, dto as any);
  }

  remove(id: string) {
    return this.repository.delete(id);
  }

  async getInstitutionForAdmin(userId: string) {
    return this.getAdminDashboardUseCase.execute(userId);
  }
}
