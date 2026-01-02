/**
 * Section Detection Controller
 *
 * Presentation layer - thin controller
 * Following MelhoresPraticas.txt: controllers for validation, auth, mapping only
 */

import { Controller, Get, Param, Query } from "@nestjs/common";
import { SectionDetectionService } from "./section-detection.service";

@Controller("contents")
export class SectionDetectionController {
  constructor(private readonly sectionService: SectionDetectionService) {}

  /**
   * GET /contents/:id/sections
   *
   * Detects sections in content based on mode
   */
  @Get(":id/sections")
  async getSections(
    @Param("id") contentId: string,
    @Query("mode") mode?: string,
  ) {
    return this.sectionService.detectSections(contentId, mode);
  }
}
