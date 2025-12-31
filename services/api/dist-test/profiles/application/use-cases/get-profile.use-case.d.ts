import { IProfileRepository } from "../../domain/profile.repository.interface";
import { Profile } from "../../domain/profile.entity";
export declare class GetProfileUseCase {
    private readonly profileRepository;
    constructor(profileRepository: IProfileRepository);
    execute(userId: string): Promise<Profile>;
}
