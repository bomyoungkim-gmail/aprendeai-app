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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAssessmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const assessment_repository_interface_1 = require("../../domain/interfaces/assessment.repository.interface");
let GetAssessmentUseCase = class GetAssessmentUseCase {
    constructor(assessmentRepository) {
        this.assessmentRepository = assessmentRepository;
    }
    async getUserAssessments(userId) {
        return this.assessmentRepository.findAllByUser(userId);
    }
    async getById(id) {
        const assessment = await this.assessmentRepository.findById(id);
        if (!assessment) {
            throw new common_1.NotFoundException("Assessment not found");
        }
        return assessment;
    }
};
exports.GetAssessmentUseCase = GetAssessmentUseCase;
exports.GetAssessmentUseCase = GetAssessmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(assessment_repository_interface_1.IAssessmentRepository)),
    __metadata("design:paramtypes", [Object])
], GetAssessmentUseCase);
//# sourceMappingURL=get-assessment.use-case.js.map