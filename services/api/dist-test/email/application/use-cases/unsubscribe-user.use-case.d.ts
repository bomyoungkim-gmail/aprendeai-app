import { IUsersRepository } from '../../../users/domain/users.repository.interface';
import { JwtService } from '@nestjs/jwt';
export declare class UnsubscribeUserUseCase {
    private readonly usersRepo;
    private readonly jwtService;
    constructor(usersRepo: IUsersRepository, jwtService: JwtService);
    execute(token: string): Promise<void>;
}
