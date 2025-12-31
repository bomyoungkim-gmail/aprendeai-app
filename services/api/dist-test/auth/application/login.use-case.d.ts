import { IUsersRepository } from "../../users/domain/users.repository.interface";
import { SubscriptionService } from "../../billing/subscription.service";
import { LoginResponse } from "../domain/auth.types";
import { TokenGeneratorService } from "../infrastructure/token-generator.service";
export declare class LoginUseCase {
    private readonly usersRepository;
    private readonly subscriptionService;
    private readonly tokenGenerator;
    constructor(usersRepository: IUsersRepository, subscriptionService: SubscriptionService, tokenGenerator: TokenGeneratorService);
    execute(email: string, pass: string): Promise<LoginResponse>;
}
