import { Module } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { ReviewController } from "./review.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfileModule } from "../profiles/profile.module";
import { SrsModule } from "../srs/srs.module";
import { VocabModule } from "../vocab/vocab.module";
import { PrismaReviewRepository } from "./infrastructure/repositories/prisma-review.repository";
import { IReviewRepository } from "./domain/review.repository.interface";
import { GetReviewQueueUseCase } from "./application/use-cases/get-review-queue.use-case";
import { SubmitReviewUseCase } from "./application/use-cases/submit-review.use-case";

@Module({
  imports: [PrismaModule, ProfileModule, SrsModule, VocabModule],
  controllers: [ReviewController],
  providers: [
    ReviewService,
    GetReviewQueueUseCase,
    SubmitReviewUseCase,
    {
      provide: IReviewRepository,
      useClass: PrismaReviewRepository,
    },
  ],
  exports: [ReviewService, GetReviewQueueUseCase, SubmitReviewUseCase, IReviewRepository],
})
export class ReviewModule {}
