import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IUsersRepository } from "../domain/users.repository.interface";
import { UserMapper } from "../infrastructure/user.mapper";

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject(IUsersRepository)
    private usersRepository: IUsersRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return UserMapper.toDto(user);
  }
}
