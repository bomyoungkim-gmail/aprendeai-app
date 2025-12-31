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
exports.StartWebClipSessionDto = exports.CreateWebClipDto = exports.CaptureMode = void 0;
const class_validator_1 = require("class-validator");
var CaptureMode;
(function (CaptureMode) {
    CaptureMode["SELECTION"] = "SELECTION";
    CaptureMode["READABILITY"] = "READABILITY";
})(CaptureMode || (exports.CaptureMode = CaptureMode = {}));
class CreateWebClipDto {
}
exports.CreateWebClipDto = CreateWebClipDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "sourceUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "siteDomain", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(CaptureMode),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "captureMode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "selectionText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "contentText", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWebClipDto.prototype, "languageHint", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateWebClipDto.prototype, "tags", void 0);
class StartWebClipSessionDto {
    constructor() {
        this.assetLayer = "L1";
        this.readingIntent = "inspectional";
        this.timeboxMin = 15;
    }
}
exports.StartWebClipSessionDto = StartWebClipSessionDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StartWebClipSessionDto.prototype, "assetLayer", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(["inspectional", "analytical"]),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], StartWebClipSessionDto.prototype, "readingIntent", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], StartWebClipSessionDto.prototype, "timeboxMin", void 0);
//# sourceMappingURL=webclip.dto.js.map