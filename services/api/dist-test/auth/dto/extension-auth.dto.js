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
exports.RefreshTokenDto = exports.DeviceCodeApproveDto = exports.DeviceCodePollDto = exports.DeviceCodeStartDto = exports.EXTENSION_SCOPES = void 0;
const class_validator_1 = require("class-validator");
exports.EXTENSION_SCOPES = [
    "extension:webclip:create",
    "extension:session:start",
    "extension:prompt:send",
];
class DeviceCodeStartDto {
    constructor() {
        this.clientId = "browser-extension";
        this.scopes = ["extension:webclip:create", "extension:session:start"];
    }
}
exports.DeviceCodeStartDto = DeviceCodeStartDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceCodeStartDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DeviceCodeStartDto.prototype, "scopes", void 0);
class DeviceCodePollDto {
}
exports.DeviceCodePollDto = DeviceCodePollDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceCodePollDto.prototype, "clientId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceCodePollDto.prototype, "deviceCode", void 0);
class DeviceCodeApproveDto {
}
exports.DeviceCodeApproveDto = DeviceCodeApproveDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DeviceCodeApproveDto.prototype, "userCode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], DeviceCodeApproveDto.prototype, "approve", void 0);
class RefreshTokenDto {
}
exports.RefreshTokenDto = RefreshTokenDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RefreshTokenDto.prototype, "refreshToken", void 0);
//# sourceMappingURL=extension-auth.dto.js.map