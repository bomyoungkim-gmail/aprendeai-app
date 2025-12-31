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
var ContentPedagogicalService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentPedagogicalService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const crypto = require("crypto");
let ContentPedagogicalService = ContentPedagogicalService_1 = class ContentPedagogicalService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ContentPedagogicalService_1.name);
    }
    async createOrUpdatePedagogicalData(contentId, data) {
        return this.prisma.content_pedagogical_data.upsert({
            where: { content_id: contentId },
            create: Object.assign(Object.assign({}, data), { id: crypto.randomUUID(), content_id: contentId, updated_at: new Date() }),
            update: Object.assign(Object.assign({}, data), { updated_at: new Date() }),
        });
    }
    async getPedagogicalData(contentId) {
        return this.prisma.content_pedagogical_data.findUnique({
            where: { content_id: contentId },
        });
    }
    async recordGameResult(data) {
        return this.prisma.game_results.create({
            data,
        });
    }
};
exports.ContentPedagogicalService = ContentPedagogicalService;
exports.ContentPedagogicalService = ContentPedagogicalService = ContentPedagogicalService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContentPedagogicalService);
//# sourceMappingURL=content-pedagogical.service.js.map