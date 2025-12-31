import { IFamilyRepository } from "../../domain/family.repository.interface";
import { Family } from "../../domain/family.entity";
import { CreateFamilyDto } from "../../dto/create-family.dto";
import { PrismaService } from "../../../prisma/prisma.service";
import { SubscriptionService } from "../../../billing/subscription.service";
export declare class CreateFamilyUseCase {
    private readonly repository;
    private readonly prisma;
    private readonly subscriptionService;
    constructor(repository: IFamilyRepository, prisma: PrismaService, subscriptionService: SubscriptionService);
    execute(userId: string, dto: CreateFamilyDto): Promise<Family>;
}
