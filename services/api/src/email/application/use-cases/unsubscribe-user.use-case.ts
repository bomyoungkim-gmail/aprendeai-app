import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUsersRepository } from '../../../users/domain/users.repository.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UnsubscribeUserUseCase {
  constructor(
    @Inject(IUsersRepository)
    private readonly usersRepo: IUsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(token: string): Promise<void> {
    const payload = this.jwtService.verify(token);
    const userId = payload.sub;

    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update settings to disable all emails
    const settings = (user as any).settings || {};
    const updatedSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        email: {
          enabled: false,
          groupInvitations: false,
          annotations: false,
          studyReminders: false,
          weeklyDigest: false,
        },
      },
    };

    await this.usersRepo.updateSettings(userId, updatedSettings);
  }
}
