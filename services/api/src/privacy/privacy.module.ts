import { Module } from '@nestjs/common';
import { FamilyPrivacyGuard } from './family-privacy-guard.service';
import { ClassroomPrivacyGuard } from './classroom-privacy-guard.service';

@Module({
  providers: [FamilyPrivacyGuard, ClassroomPrivacyGuard],
  exports: [FamilyPrivacyGuard, ClassroomPrivacyGuard],
})
export class PrivacyModule {}
