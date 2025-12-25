import { Module } from "@nestjs/common";
import { ReviewService } from "./review.service";
import { ReviewController } from "./review.controller";
import { PrismaModule } from "../prisma/prisma.module";
import { ProfileModule } from "../profiles/profile.module";
import { SrsModule } from "../srs/srs.module";

@Module({
  imports: [PrismaModule, ProfileModule, SrsModule],
  controllers: [ReviewController],
  providers: [ReviewService],
  exports: [ReviewService],
})
export class ReviewModule {}
