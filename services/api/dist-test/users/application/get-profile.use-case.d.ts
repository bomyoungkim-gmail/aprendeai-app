import { IUsersRepository } from "../domain/users.repository.interface";
export declare class GetProfileUseCase {
    private usersRepository;
    constructor(usersRepository: IUsersRepository);
    execute(userId: string): Promise<{
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
