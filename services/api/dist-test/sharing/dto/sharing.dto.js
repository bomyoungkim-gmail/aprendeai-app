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
exports.GetThreadsQuery = exports.CreateCommentRequest = exports.ShareAnnotationRequest = exports.ShareContentRequest = exports.CommentTargetType = exports.AnnotationShareMode = exports.SharePermission = exports.ShareContextType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var ShareContextType;
(function (ShareContextType) {
    ShareContextType["CLASSROOM"] = "CLASSROOM";
    ShareContextType["FAMILY"] = "FAMILY";
    ShareContextType["STUDY_GROUP"] = "STUDY_GROUP";
})(ShareContextType || (exports.ShareContextType = ShareContextType = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["COMMENT"] = "COMMENT";
    SharePermission["ASSIGN"] = "ASSIGN";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
var AnnotationShareMode;
(function (AnnotationShareMode) {
    AnnotationShareMode["VIEW"] = "VIEW";
    AnnotationShareMode["COMMENT"] = "COMMENT";
})(AnnotationShareMode || (exports.AnnotationShareMode = AnnotationShareMode = {}));
var CommentTargetType;
(function (CommentTargetType) {
    CommentTargetType["CONTENT"] = "CONTENT";
    CommentTargetType["ANNOTATION"] = "ANNOTATION";
    CommentTargetType["SUBMISSION"] = "SUBMISSION";
})(CommentTargetType || (exports.CommentTargetType = CommentTargetType = {}));
class ShareContentRequest {
}
exports.ShareContentRequest = ShareContentRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ShareContextType }),
    (0, class_validator_1.IsEnum)(ShareContextType),
    __metadata("design:type", String)
], ShareContentRequest.prototype, "contextType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareContentRequest.prototype, "contextId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: SharePermission }),
    (0, class_validator_1.IsEnum)(SharePermission),
    __metadata("design:type", String)
], ShareContentRequest.prototype, "permission", void 0);
class ShareAnnotationRequest {
}
exports.ShareAnnotationRequest = ShareAnnotationRequest;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ShareContextType }),
    (0, class_validator_1.IsEnum)(ShareContextType),
    __metadata("design:type", String)
], ShareAnnotationRequest.prototype, "contextType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareAnnotationRequest.prototype, "contextId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: AnnotationShareMode }),
    (0, class_validator_1.IsEnum)(AnnotationShareMode),
    __metadata("design:type", String)
], ShareAnnotationRequest.prototype, "mode", void 0);
class CreateCommentRequest {
}
exports.CreateCommentRequest = CreateCommentRequest;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCommentRequest.prototype, "body", void 0);
class GetThreadsQuery {
}
exports.GetThreadsQuery = GetThreadsQuery;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ShareContextType }),
    (0, class_validator_1.IsEnum)(ShareContextType),
    __metadata("design:type", String)
], GetThreadsQuery.prototype, "contextType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetThreadsQuery.prototype, "contextId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CommentTargetType }),
    (0, class_validator_1.IsEnum)(CommentTargetType),
    __metadata("design:type", String)
], GetThreadsQuery.prototype, "targetType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], GetThreadsQuery.prototype, "targetId", void 0);
//# sourceMappingURL=sharing.dto.js.map