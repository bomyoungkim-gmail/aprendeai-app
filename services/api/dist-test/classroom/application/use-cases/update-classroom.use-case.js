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
exports.UpdateClassroomUseCase = void 0;
const common_1 = require("@nestjs/common");
const classroom_repository_interface_1 = require("../../domain/interfaces/classroom.repository.interface");
const classroom_entity_1 = require("../../domain/entities/classroom.entity");
let UpdateClassroomUseCase = class UpdateClassroomUseCase {
    constructor(classroomRepo) {
        this.classroomRepo = classroomRepo;
    }
    async execute(id, dto) {
        var _a, _b;
        const existing = await this.classroomRepo.findById(id);
        if (!existing) {
            throw new common_1.NotFoundException(`Classroom with ID ${id} not found`);
        }
        const updated = new classroom_entity_1.Classroom(existing.id, (_a = dto.name) !== null && _a !== void 0 ? _a : existing.name, existing.ownerEducatorId, existing.institutionId, (_b = dto.gradeLevel) !== null && _b !== void 0 ? _b : existing.gradeLevel, new Date());
        return this.classroomRepo.update(updated);
    }
};
exports.UpdateClassroomUseCase = UpdateClassroomUseCase;
exports.UpdateClassroomUseCase = UpdateClassroomUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(classroom_repository_interface_1.IClassroomRepository)),
    __metadata("design:paramtypes", [Object])
], UpdateClassroomUseCase);
//# sourceMappingURL=update-classroom.use-case.js.map