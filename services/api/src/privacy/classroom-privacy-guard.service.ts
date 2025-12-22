import { Injectable, Logger } from '@nestjs/common';
import { ClassPrivacyMode, StudentData } from './types';

@Injectable()
export class ClassroomPrivacyGuard {
  private readonly logger = new Logger(ClassroomPrivacyGuard.name);

  /**
   * Filter student data based on classroom privacy mode
   */
  filterStudentData(
    data: StudentData,
    privacyMode: ClassPrivacyMode,
  ): StudentData {
    const filtered: StudentData = {
      learnerUserId: data.learnerUserId,
      nickname: data.nickname,
      
      // Always visible: basic progress
      progressPercent: data.progressPercent,
      lastActivityDate: data.lastActivityDate,
    };

    // Apply mode-specific filters
    if (privacyMode === ClassPrivacyMode.AGGREGATED_ONLY) {
      // AGGREGATED_ONLY: Basic stats only
      this.logger.debug('Filtering with AGGREGATED_ONLY mode');
      return filtered;
    }

    if (privacyMode === ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS) {
      // AGGREGATED_PLUS_HELP_REQUESTS: Stats + help requests (when student asks)
      this.logger.debug('Filtering with AGGREGATED_PLUS_HELP_REQUESTS mode');
      
      filtered.helpRequests = data.helpRequests;
      // Still hide comprehension scores and struggles
      
      return filtered;
    }

    if (privacyMode === ClassPrivacyMode.AGGREGATED_PLUS_FLAGS) {
      // AGGREGATED_PLUS_FLAGS: Stats + risk alerts
      this.logger.debug('Filtering with AGGREGATED_PLUS_FLAGS mode');
      
      filtered.comprehensionScore = data.comprehensionScore;
      filtered.struggles = data.struggles;
      
      return filtered;
    }

    return filtered;
  }

  /**
   * Filter a list of students based on privacy mode
   */
  filterStudentList(
    students: StudentData[],
    privacyMode: ClassPrivacyMode,
  ): StudentData[] {
    return students.map((student) => this.filterStudentData(student, privacyMode));
  }

  /**
   * Check if teacher can view detailed student data
   */
  canViewStudentDetails(privacyMode: ClassPrivacyMode): boolean {
    return (
      privacyMode === ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS ||
      privacyMode === ClassPrivacyMode.AGGREGATED_PLUS_FLAGS
    );
  }

  /**
   * Check if help request from student triggers detail visibility
   */
  shouldRevealDetailsOnHelpRequest(privacyMode: ClassPrivacyMode): boolean {
    return privacyMode === ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS;
  }
}
