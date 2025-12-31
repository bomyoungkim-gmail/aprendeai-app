import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import { IUsersRepository } from "../domain/users.repository.interface";
import { UserMapper } from "../infrastructure/user.mapper";
import { UpdateProfileDto } from "../dto/user.dto";

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject(IUsersRepository)
    private usersRepository: IUsersRepository,
  ) {}

  async execute(userId: string, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.updateProfile(dto.name || user.name || "");

    // In a real Transaction, we would use a UnitOfWork here.
    const updated = await this.usersRepository.update(userId, dto);

    return UserMapper.toDto(updated);
  }
}
