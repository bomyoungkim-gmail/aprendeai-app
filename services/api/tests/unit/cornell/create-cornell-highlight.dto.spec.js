"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const class_validator_1 = require("class-validator");
const enums_1 = require("../../../src/common/constants/enums");
const create_cornell_highlight_dto_1 = require("../../../src/cornell/dto/create-cornell-highlight.dto");
describe("CreateCornellHighlightDto", () => {
    describe("Basic Validation", () => {
        it("should validate a valid PDF highlight", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "NOTE";
            dto.target_type = enums_1.TargetType.PDF;
            dto.page_number = 1;
            dto.anchor_json = { x: 100, y: 200, width: 150, height: 50 };
            dto.comment_text = "Important note";
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBe(0);
        });
        it("should validate a valid video highlight with timestamp", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "QUESTION";
            dto.target_type = enums_1.TargetType.VIDEO;
            dto.timestamp_ms = 30000;
            dto.duration_ms = 5000;
            dto.comment_text = "What does this mean?";
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBe(0);
        });
        it("should reject invalid type", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "INVALID";
            dto.target_type = enums_1.TargetType.PDF;
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBeGreaterThan(0);
            expect(errors[0].constraints).toHaveProperty("isEnum");
        });
    });
    describe("Conditional Field Validation", () => {
        it("should require page_number for PDF", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "HIGHLIGHT";
            dto.target_type = enums_1.TargetType.PDF;
            const errors = await (0, class_validator_1.validate)(dto);
            const pageNumberError = errors.find((e) => e.property === "page_number");
            expect(pageNumberError).toBeDefined();
        });
        it("should require timestamp_ms for VIDEO", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "NOTE";
            dto.target_type = enums_1.TargetType.VIDEO;
            const errors = await (0, class_validator_1.validate)(dto);
            const timestampError = errors.find((e) => e.property === "timestamp_ms");
            expect(timestampError).toBeDefined();
        });
        it("should not require page_number for VIDEO", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "STAR";
            dto.target_type = enums_1.TargetType.VIDEO;
            dto.timestamp_ms = 15000;
            const errors = await (0, class_validator_1.validate)(dto);
            const pageNumberError = errors.find((e) => e.property === "page_number");
            expect(pageNumberError).toBeUndefined();
        });
    });
    describe("Granular Sharing Validation", () => {
        it("should validate GROUP visibility with all required fields", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "NOTE";
            dto.target_type = enums_1.TargetType.PDF;
            dto.page_number = 1;
            dto.anchor_json = { x: 0, y: 0, width: 100, height: 100 };
            dto.visibility = enums_1.AnnotationVisibility.GROUP;
            dto.visibility_scope = enums_1.VisibilityScope.CLASS_PROJECT;
            dto.context_type = enums_1.ContextType.INSTITUTION;
            dto.context_id = "institution-123";
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBe(0);
        });
        it("should require context fields when visibility is GROUP", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "NOTE";
            dto.target_type = enums_1.TargetType.PDF;
            dto.page_number = 1;
            dto.visibility = enums_1.AnnotationVisibility.GROUP;
            const errors = await (0, class_validator_1.validate)(dto);
            expect(errors.length).toBeGreaterThan(0);
        });
        it("should require learner_id for RESPONSIBLES_OF_LEARNER scope", async () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "QUESTION";
            dto.target_type = enums_1.TargetType.IMAGE;
            dto.anchor_json = { x: 0, y: 0, width: 100, height: 100 };
            dto.visibility = enums_1.AnnotationVisibility.GROUP;
            dto.visibility_scope = enums_1.VisibilityScope.RESPONSIBLES_OF_LEARNER;
            dto.context_type = enums_1.ContextType.INSTITUTION;
            dto.context_id = "institution-456";
            const errors = await (0, class_validator_1.validate)(dto);
            const learnerIdError = errors.find((e) => e.property === "learner_id");
            expect(learnerIdError).toBeDefined();
        });
    });
    describe("Auto-Computed Properties", () => {
        it("should compute color_key for NOTE type", () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "NOTE";
            expect(dto.color_key).toBe("green");
        });
        it("should compute color_key for QUESTION type", () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "QUESTION";
            expect(dto.color_key).toBe("red");
        });
        it("should compute tags_json for STAR type", () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "STAR";
            expect(dto.tags_json).toContain("star");
            expect(dto.tags_json).toContain("important");
        });
        it("should compute tags_json for HIGHLIGHT type", () => {
            const dto = new create_cornell_highlight_dto_1.CreateCornellHighlightDto();
            dto.type = "HIGHLIGHT";
            expect(dto.tags_json).toEqual(["highlight"]);
        });
    });
});
describe("UpdateHighlightVisibilityDto", () => {
    it("should validate visibility update", async () => {
        const dto = new create_cornell_highlight_dto_1.UpdateHighlightVisibilityDto();
        dto.visibility = enums_1.AnnotationVisibility.PUBLIC;
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
    it("should validate complete GROUP visibility update", async () => {
        const dto = new create_cornell_highlight_dto_1.UpdateHighlightVisibilityDto();
        dto.visibility = enums_1.AnnotationVisibility.GROUP;
        dto.visibility_scope = enums_1.VisibilityScope.ONLY_EDUCATORS;
        dto.context_type = enums_1.ContextType.FAMILY;
        dto.context_id = "family-789";
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
});
describe("CreateAnnotationCommentDto", () => {
    it("should validate comment creation", async () => {
        const dto = new create_cornell_highlight_dto_1.CreateAnnotationCommentDto();
        dto.text = "Great point!";
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBe(0);
    });
    it("should require text field", async () => {
        const dto = new create_cornell_highlight_dto_1.CreateAnnotationCommentDto();
        const errors = await (0, class_validator_1.validate)(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe("text");
    });
});
//# sourceMappingURL=create-cornell-highlight.dto.spec.js.map