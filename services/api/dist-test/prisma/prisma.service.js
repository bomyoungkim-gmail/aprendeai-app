"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const request_context_1 = require("../common/context/request-context");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.TENANT_MODELS = [
            "reading_sessions",
            "session_events",
            "user_vocabularies",
            "cornell_notes",
            "highlights",
            "daily_goals",
            "streaks",
            "user_badges",
        ];
    }
    async onModuleInit() {
        await this.$connect();
        this.registerMiddleware();
        this.logger.log("Prisma connected with tenant isolation middleware");
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    registerMiddleware() {
        this.$use(async (params, next) => {
            const user = (0, request_context_1.getCurrentUser)();
            if (!user) {
                return next(params);
            }
            if (!this.TENANT_MODELS.includes(params.model || "")) {
                return next(params);
            }
            if (this.isReadOperation(params.action)) {
                params.args.where = Object.assign(Object.assign({}, params.args.where), { institution_id: user.institutionId });
            }
            if (params.action === "create") {
                params.args.data = Object.assign(Object.assign({}, params.args.data), { institution_id: user.institutionId });
            }
            if (params.action === "createMany") {
                if (Array.isArray(params.args.data)) {
                    params.args.data = params.args.data.map((item) => (Object.assign(Object.assign({}, item), { institution_id: user.institutionId })));
                }
            }
            if (this.isWriteOperation(params.action)) {
                params.args.where = Object.assign(Object.assign({}, params.args.where), { institution_id: user.institutionId });
            }
            return next(params);
        });
    }
    isReadOperation(action) {
        return [
            "findUnique",
            "findFirst",
            "findMany",
            "count",
            "aggregate",
            "groupBy",
        ].includes(action);
    }
    isWriteOperation(action) {
        return ["update", "updateMany", "upsert", "delete", "deleteMany"].includes(action);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map