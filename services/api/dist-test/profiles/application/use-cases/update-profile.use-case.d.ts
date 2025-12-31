import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";
import { UpdateProfileDto } from "../../dto/profile.dto";
export declare class UpdateProfileUseCase {
    private readonly profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(userId: string, dto: UpdateProfileDto): Promise<Profile>;
}
