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
exports.AdvancePhaseDto = exports.RecordEventDto = exports.PrePhaseDto = void 0;
const class_validator_1 = require("class-validator");
class PrePhaseDto {
}
exports.PrePhaseDto = PrePhaseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10, { message: "Goal statement must be at least 10 characters" }),
    __metadata("design:type", String)
], PrePhaseDto.prototype, "goalStatement", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10, { message: "Prediction must be at least 10 characters" }),
    __metadata("design:type", String)
], PrePhaseDto.prototype, "predictionText", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(3, { message: "Minimum 3 target words required" }),
    __metadata("design:type", Array)
], PrePhaseDto.prototype, "targetWordsJson", void 0);
class RecordEventDto {
}
exports.RecordEventDto = RecordEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RecordEventDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], RecordEventDto.prototype, "payload", void 0);
class AdvancePhaseDto {
}
exports.AdvancePhaseDto = AdvancePhaseDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], AdvancePhaseDto.prototype, "toPhase", void 0);
//# sourceMappingURL=reading-sessions.dto.js.map