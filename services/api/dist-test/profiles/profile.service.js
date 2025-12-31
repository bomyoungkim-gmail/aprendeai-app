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
exports.ProfileService = void 0;
const common_1 = require("@nestjs/common");
const get_profile_use_case_1 = require("./application/use-cases/get-profile.use-case");
const update_profile_use_case_1 = require("./application/use-cases/update-profile.use-case");
let ProfileService = class ProfileService {
    constructor(getProfileUseCase, updateProfileUseCase) {
        this.getProfileUseCase = getProfileUseCase;
        this.updateProfileUseCase = updateProfileUseCase;
    }
    async getOrCreate(userId) {
        return this.getProfileUseCase.execute(userId);
    }
    async get(userId) {
        return this.getProfileUseCase.execute(userId);
    }
    async update(userId, data) {
        return this.updateProfileUseCase.execute(userId, data);
    }
};
exports.ProfileService = ProfileService;
exports.ProfileService = ProfileService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [get_profile_use_case_1.GetProfileUseCase,
        update_profile_use_case_1.UpdateProfileUseCase])
], ProfileService);
//# sourceMappingURL=profile.service.js.map