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
exports.GetStudentProgressUseCase = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_interface_1 = require("../../domain/analytics.repository.interface");
let GetStudentProgressUseCase = class GetStudentProgressUseCase {
    constructor(repository) {
        this.repository = repository;
    }
    async execute(userId) {
        const vocabCount = await this.repository.countMasteredVocab(userId, 50);
        const answers = await this.repository.getAssessmentAnswers(userId);
        const skillMap = new Map();
        for (const ans of answers) {
            const skills = ans.assessment_questions.skills || [];
            for (const skill of skills) {
                if (!skillMap.has(skill)) {
                    skillMap.set(skill, { success: 0, error: 0 });
                }
                const entry = skillMap.get(skill);
                if (ans.is_correct) {
                    entry.success++;
                }
                else {
                    entry.error++;
                }
            }
        }
        const weakPoints = [];
        const strongPoints = [];
        skillMap.forEach((stats, skill) => {
            if (stats.error > stats.success) {
                weakPoints.push({ skill, errorCount: stats.error });
            }
            else {
                strongPoints.push({ skill, successCount: stats.success });
            }
        });
        weakPoints.sort((a, b) => b.errorCount - a.errorCount);
        strongPoints.sort((a, b) => b.successCount - a.successCount);
        return {
            vocabularySize: vocabCount,
            weakPoints: weakPoints.slice(0, 5),
            strongPoints: strongPoints.slice(0, 5),
        };
    }
};
exports.GetStudentProgressUseCase = GetStudentProgressUseCase;
exports.GetStudentProgressUseCase = GetStudentProgressUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(analytics_repository_interface_1.IAnalyticsRepository)),
    __metadata("design:paramtypes", [Object])
], GetStudentProgressUseCase);
//# sourceMappingURL=get-student-progress.use-case.js.map