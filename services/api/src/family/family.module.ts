import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { PrismaModule } from '../prisma/prisma.module';
// import { AuthModule } from '../auth/auth.module'; // If needed for guards

@Module({
  imports: [PrismaModule],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [FamilyService],
})
export class FamilyModule {}
