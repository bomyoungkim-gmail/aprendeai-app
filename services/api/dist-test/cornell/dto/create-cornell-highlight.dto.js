"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAnnotationCommentDto = exports.UpdateHighlightVisibilityDto = exports.CreateCornellHighlightDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const enums_1 = require("../../common/constants/enums");
const cornell_type_map_1 = require("../constants/cornell-type-map");
class CreateCornellHighlightDto {
    get color_key() {
        return (0, cornell_type_map_1.getColorForType)(this.type);
    }
    get tags_json() {
        return (0, cornell_type_map_1.getTagsForType)(this.type);
    }
}
exports.CreateCornellHighlightDto = CreateCornellHighlightDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: ["HIGHLIGHT", "NOTE", "STAR", "QUESTION"],
        description: "Cornell annotation type",
        example: "NOTE",
    }),
    (0, class_validator_1.IsEnum)(["HIGHLIGHT", "NOTE", "STAR", "QUESTION"], {
        message: "Type must be one of: HIGHLIGHT, NOTE, STAR, QUESTION",
    }),
    __metadata("design:type", Object)
], CreateCornellHighlightDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: enums_1.TargetType,
        description: "Media type being annotated",
        example: "PDF",
    }),
    (0, class_validator_1.IsEnum)(enums_1.TargetType, {
        message: "Target type must be PDF, IMAGE, DOCX, VIDEO, or AUDIO",
    }),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "target_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Page number (required for PDF/DOCX)",
        example: 1,
        minimum: 1,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.target_type === enums_1.TargetType.PDF || o.target_type === enums_1.TargetType.DOCX),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateCornellHighlightDto.prototype, "page_number", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Anchor geometry (required for PDF/IMAGE)",
        example: { x: 100, y: 200, width: 150, height: 50 },
    }),
    (0, class_validator_1.ValidateIf)((o) => o.target_type === enums_1.TargetType.PDF || o.target_type === enums_1.TargetType.IMAGE),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateCornellHighlightDto.prototype, "anchor_json", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Timestamp in milliseconds (required for VIDEO/AUDIO)",
        example: 30000,
        minimum: 0,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.target_type === enums_1.TargetType.VIDEO || o.target_type === enums_1.TargetType.AUDIO),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCornellHighlightDto.prototype, "timestamp_ms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Duration in milliseconds (optional for VIDEO/AUDIO)",
        example: 5000,
        minimum: 0,
    }),
    (0, class_validator_1.ValidateIf)((o) => o.target_type === enums_1.TargetType.VIDEO || o.target_type === enums_1.TargetType.AUDIO),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateCornellHighlightDto.prototype, "duration_ms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Comment/note text",
        example: "This is an important concept about photosynthesis",
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "comment_text", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: enums_1.AnnotationVisibility,
        description: "Visibility level",
        default: enums_1.AnnotationVisibility.PRIVATE,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.AnnotationVisibility),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: enums_1.VisibilityScope,
        description: "Granular scope (required if visibility is GROUP)",
    }),
    (0, class_validator_1.ValidateIf)((o) => o.visibility === enums_1.AnnotationVisibility.GROUP),
    (0, class_validator_1.IsEnum)(enums_1.VisibilityScope),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "visibility_scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        enum: enums_1.ContextType,
        description: "Context type (required if visibility is GROUP)",
    }),
    (0, class_validator_1.ValidateIf)((o) => o.visibility === enums_1.AnnotationVisibility.GROUP),
    (0, class_validator_1.IsEnum)(enums_1.ContextType),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "context_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Context ID (required if visibility is GROUP)",
        example: "institution-123",
    }),
    (0, class_validator_1.ValidateIf)((o) => o.visibility === enums_1.AnnotationVisibility.GROUP),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "context_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: "Learner ID (required for RESPONSIBLES_OF_LEARNER scope)",
        example: "user-456",
    }),
    (0, class_validator_1.ValidateIf)((o) => o.visibility_scope === enums_1.VisibilityScope.RESPONSIBLES_OF_LEARNER),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCornellHighlightDto.prototype, "learner_id", void 0);
class UpdateHighlightVisibilityDto {
}
exports.UpdateHighlightVisibilityDto = UpdateHighlightVisibilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: enums_1.AnnotationVisibility }),
    (0, class_validator_1.IsEnum)(enums_1.AnnotationVisibility),
    __metadata("design:type", String)
], UpdateHighlightVisibilityDto.prototype, "visibility", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.VisibilityScope }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.VisibilityScope),
    __metadata("design:type", String)
], UpdateHighlightVisibilityDto.prototype, "visibility_scope", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: enums_1.ContextType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(enums_1.ContextType),
    __metadata("design:type", String)
], UpdateHighlightVisibilityDto.prototype, "context_type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateHighlightVisibilityDto.prototype, "context_id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateHighlightVisibilityDto.prototype, "learner_id", void 0);
class CreateAnnotationCommentDto {
}
exports.CreateAnnotationCommentDto = CreateAnnotationCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Comment text",
        example: "I agree with this point",
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAnnotationCommentDto.prototype, "text", void 0);
//# sourceMappingURL=create-cornell-highlight.dto.js.map