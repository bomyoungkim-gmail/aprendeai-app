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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAssessmentUseCase = void 0;
const common_1 = require("@nestjs/common");
const assessment_repository_interface_1 = require("../../domain/interfaces/assessment.repository.interface");
const assessment_entity_1 = require("../../domain/entities/assessment.entity");
const assessment_question_entity_1 = require("../../domain/entities/assessment-question.entity");
const crypto = require("crypto");
let CreateAssessmentUseCase = class CreateAssessmentUseCase {
    constructor(assessmentRepository) {
        this.assessmentRepository = assessmentRepository;
    }
    async execute(dto) {
        const { questions } = dto, data = __rest(dto, ["questions"]);
        const assessment = new assessment_entity_1.Assessment({
            id: crypto.randomUUID(),
            contentId: data.contentId,
            contentVersionId: data.contentVersionId,
            schoolingLevelTarget: data.schoolingLevelTarget || "HIGHER_EDUCATION",
            questions: questions.map((q) => new assessment_question_entity_1.AssessmentQuestion({
                id: crypto.randomUUID(),
                questionType: q.questionType,
                questionText: q.questionText,
                options: q.options || [],
                correctAnswer: q.correctAnswer,
            })),
        });
        return this.assessmentRepository.create(assessment);
    }
};
exports.CreateAssessmentUseCase = CreateAssessmentUseCase;
exports.CreateAssessmentUseCase = CreateAssessmentUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(assessment_repository_interface_1.IAssessmentRepository)),
    __metadata("design:paramtypes", [Object])
], CreateAssessmentUseCase);
//# sourceMappingURL=create-assessment.use-case.js.map