import { IUsersRepository } from "../domain/users.repository.interface";
import { UpdateProfileDto } from "../dto/user.dto";
export declare class UpdateProfileUseCase {
    private usersRepository;
    constructor(usersRepository: IUsersRepository);
    execute(userId: string, dto: UpdateProfileDto): Promise<{
        id: any;
        email: any;
        name: any;
        systemRole: any;
        contextRole: any;
        institution_id: any;
        createdAt: any;
        updatedAt: any;
        institutionId?: undefined;
    } | {
        id: any;
        name: any;
        email: any;
        systemRole: any;
        contextRole: any;
        institutionId: any;
        createdAt: any;
        updatedAt: any;
        institution_id?: undefined;
    }>;
}
