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
exports.OutcomesService = void 0;
const common_1 = require("@nestjs/common");
const compute_session_outcomes_use_case_1 = require("./application/use-cases/compute-session-outcomes.use-case");
let OutcomesService = class OutcomesService {
    constructor(computeSessionOutcomesUseCase) {
        this.computeSessionOutcomesUseCase = computeSessionOutcomesUseCase;
    }
    async computeSessionOutcomes(sessionId) {
        return this.computeSessionOutcomesUseCase.execute(sessionId);
    }
};
exports.OutcomesService = OutcomesService;
exports.OutcomesService = OutcomesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [compute_session_outcomes_use_case_1.ComputeSessionOutcomesUseCase])
], OutcomesService);
//# sourceMappingURL=outcomes.service.js.map