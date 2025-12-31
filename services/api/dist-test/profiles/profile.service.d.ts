import { UpdateProfileDto } from "./dto/profile.dto";
import { GetProfileUseCase } from "./application/use-cases/get-profile.use-case";
import { UpdateProfileUseCase } from "./application/use-cases/update-profile.use-case";
export declare class ProfileService {
    private readonly getProfileUseCase;
    private readonly updateProfileUseCase;
    constructor(getProfileUseCase: GetProfileUseCase, updateProfileUseCase: UpdateProfileUseCase);
    getOrCreate(userId: string): Promise<import("./domain/profile.entity").Profile>;
    get(userId: string): Promise<import("./domain/profile.entity").Profile>;
    update(userId: string, data: UpdateProfileDto): Promise<import("./domain/profile.entity").Profile>;
}
