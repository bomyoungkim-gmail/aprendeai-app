import { Injectable, Inject } from "@nestjs/common";
import { IActivityRepository } from "../../domain/interfaces/activity.repository.interface";
import { startOfDay } from "date-fns";

@Injectable()
export class TrackActivityUseCase {
  constructor(
    @Inject(IActivityRepository)
    private readonly activityRepo: IActivityRepository,
  ) {}

  async execute(
    userId: string,
    type: "study" | "annotation" | "read" | "session",
    minutes: number = 1,
  ): Promise<void> {
    const today = startOfDay(new Date());
    const data = {
      minutesStudied: type === "study" ? minutes : 0,
      sessionsCount: type === "session" ? 1 : 0,
      contentsRead: type === "read" ? 1 : 0,
      annotationsCreated: type === "annotation" ? 1 : 0,
    };

    await this.activityRepo.track(userId, today, data);
  }
}
