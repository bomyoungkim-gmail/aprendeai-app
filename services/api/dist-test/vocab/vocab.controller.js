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
exports.VocabController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const vocab_service_1 = require("./vocab.service");
let VocabController = class VocabController {
    constructor(vocabService) {
        this.vocabService = vocabService;
    }
    async createFromTargets(req, sessionId) {
        var _a;
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || "test-user-id";
        const session = await this.vocabService["prisma"].reading_sessions.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.user_id !== userId) {
            throw new Error("Forbidden");
        }
        return this.vocabService.createFromTargetWords(sessionId);
    }
};
exports.VocabController = VocabController;
__decorate([
    (0, common_1.Post)("sessions/:sessionId/from-targets"),
    (0, swagger_1.ApiOperation)({ summary: "Create vocab from session target words" }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "Vocabulary items created successfully",
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)("sessionId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], VocabController.prototype, "createFromTargets", null);
exports.VocabController = VocabController = __decorate([
    (0, swagger_1.ApiTags)("Vocabulary"),
    (0, common_1.Controller)("vocab"),
    __metadata("design:paramtypes", [vocab_service_1.VocabService])
], VocabController);
//# sourceMappingURL=vocab.controller.js.map