import { PrismaService } from "../../../prisma/prisma.service";
import { IGameProgressRepository } from "../../domain/interfaces/game-progress.repository.interface";
import { GameProgress } from "../../domain/entities/game-progress.entity";
export declare class PrismaGameProgressRepository implements IGameProgressRepository {
    private prisma;
    constructor(prisma: PrismaService);
    findByUser(userId: string): Promise<GameProgress[]>;
    findByUserAndGame(userId: string, gameId: string): Promise<GameProgress | null>;
    save(progress: GameProgress): Promise<GameProgress>;
    private mapToDomain;
}
