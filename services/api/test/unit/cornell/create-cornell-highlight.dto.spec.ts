/**
 * Tests for Cornell Highlight DTOs
 *
 * Validates enum usage, conditional fields, and auto-computed properties
 */

import { validate } from "class-validator";
import {
  TargetType,
  AnnotationVisibility,
  VisibilityScope,
  ContextType,
} from "../../../src/common/constants/enums";
import {
  CreateCornellHighlightDto,
  UpdateHighlightVisibilityDto,
  CreateAnnotationCommentDto,
} from "../../../src/cornell/dto/create-cornell-highlight.dto";

describe("CreateCornellHighlightDto", () => {
  describe("Basic Validation", () => {
    it("should validate a valid PDF highlight", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "NOTE";
      dto.target_type = TargetType.PDF;
      dto.page_number = 1;
      dto.anchor_json = { x: 100, y: 200, width: 150, height: 50 };
      dto.comment_text = "Important note";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should validate a valid video highlight with timestamp", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "QUESTION";
      dto.target_type = TargetType.VIDEO;
      dto.timestamp_ms = 30000;
      dto.duration_ms = 5000;
      dto.comment_text = "What does this mean?";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should reject invalid type", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "INVALID" as any;
      dto.target_type = TargetType.PDF;

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints).toHaveProperty("isEnum");
    });
  });

  describe("Conditional Field Validation", () => {
    it("should require page_number for PDF", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "HIGHLIGHT";
      dto.target_type = TargetType.PDF;
      // Missing page_number

      const errors = await validate(dto);
      const pageNumberError = errors.find((e) => e.property === "page_number");
      expect(pageNumberError).toBeDefined();
    });

    it("should require timestamp_ms for VIDEO", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "NOTE";
      dto.target_type = TargetType.VIDEO;
      // Missing timestamp_ms

      const errors = await validate(dto);
      const timestampError = errors.find((e) => e.property === "timestamp_ms");
      expect(timestampError).toBeDefined();
    });

    it("should not require page_number for VIDEO", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "STAR";
      dto.target_type = TargetType.VIDEO;
      dto.timestamp_ms = 15000;
      // Not providing page_number is OK for video

      const errors = await validate(dto);
      const pageNumberError = errors.find((e) => e.property === "page_number");
      expect(pageNumberError).toBeUndefined();
    });
  });

  describe("Granular Sharing Validation", () => {
    it("should validate GROUP visibility with all required fields", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "NOTE";
      dto.target_type = TargetType.PDF;
      dto.page_number = 1;
      dto.anchor_json = { x: 0, y: 0, width: 100, height: 100 };
      dto.visibility = AnnotationVisibility.GROUP;
      dto.visibility_scope = VisibilityScope.CLASS_PROJECT;
      dto.context_type = ContextType.INSTITUTION;
      dto.context_id = "institution-123";

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it("should require context fields when visibility is GROUP", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "NOTE";
      dto.target_type = TargetType.PDF;
      dto.page_number = 1;
      dto.visibility = AnnotationVisibility.GROUP;
      // Missing visibility_scope, context_type, context_id

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should require learner_id for RESPONSIBLES_OF_LEARNER scope", async () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "QUESTION";
      dto.target_type = TargetType.IMAGE;
      dto.anchor_json = { x: 0, y: 0, width: 100, height: 100 };
      dto.visibility = AnnotationVisibility.GROUP;
      dto.visibility_scope = VisibilityScope.RESPONSIBLES_OF_LEARNER;
      dto.context_type = ContextType.INSTITUTION;
      dto.context_id = "institution-456";
      // Missing learner_id

      const errors = await validate(dto);
      const learnerIdError = errors.find((e) => e.property === "learner_id");
      expect(learnerIdError).toBeDefined();
    });
  });

  describe("Auto-Computed Properties", () => {
    it("should compute color_key for NOTE type", () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "NOTE";

      expect(dto.color_key).toBe("green");
    });

    it("should compute color_key for QUESTION type", () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "QUESTION";

      expect(dto.color_key).toBe("red");
    });

    it("should compute tags_json for STAR type", () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "STAR";

      expect(dto.tags_json).toContain("star");
      expect(dto.tags_json).toContain("important");
    });

    it("should compute tags_json for HIGHLIGHT type", () => {
      const dto = new CreateCornellHighlightDto();
      dto.type = "HIGHLIGHT";

      expect(dto.tags_json).toEqual(["highlight"]);
    });
  });
});

describe("UpdateHighlightVisibilityDto", () => {
  it("should validate visibility update", async () => {
    const dto = new UpdateHighlightVisibilityDto();
    dto.visibility = AnnotationVisibility.PUBLIC;

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should validate complete GROUP visibility update", async () => {
    const dto = new UpdateHighlightVisibilityDto();
    dto.visibility = AnnotationVisibility.GROUP;
    dto.visibility_scope = VisibilityScope.ONLY_EDUCATORS;
    dto.context_type = ContextType.FAMILY;
    dto.context_id = "family-789";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

describe("CreateAnnotationCommentDto", () => {
  it("should validate comment creation", async () => {
    const dto = new CreateAnnotationCommentDto();
    dto.text = "Great point!";

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it("should require text field", async () => {
    const dto = new CreateAnnotationCommentDto();
    // Missing text

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe("text");
  });
});
