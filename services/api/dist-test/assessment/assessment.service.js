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
exports.AssessmentService = void 0;
const common_1 = require("@nestjs/common");
const create_assessment_use_case_1 = require("./application/use-cases/create-assessment.use-case");
const get_assessment_use_case_1 = require("./application/use-cases/get-assessment.use-case");
const submit_assessment_use_case_1 = require("./application/use-cases/submit-assessment.use-case");
let AssessmentService = class AssessmentService {
    constructor(createUseCase, getUseCase, submitUseCase) {
        this.createUseCase = createUseCase;
        this.getUseCase = getUseCase;
        this.submitUseCase = submitUseCase;
    }
    async create(createAssessmentDto) {
        return this.createUseCase.execute(createAssessmentDto);
    }
    findAllByUser(userId) {
        return this.getUseCase.getUserAssessments(userId);
    }
    async submitAssessment(userId, assessmentId, dto) {
        return this.submitUseCase.execute(userId, assessmentId, dto);
    }
};
exports.AssessmentService = AssessmentService;
exports.AssessmentService = AssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [create_assessment_use_case_1.CreateAssessmentUseCase,
        get_assessment_use_case_1.GetAssessmentUseCase,
        submit_assessment_use_case_1.SubmitAssessmentUseCase])
], AssessmentService);
//# sourceMappingURL=assessment.service.js.map