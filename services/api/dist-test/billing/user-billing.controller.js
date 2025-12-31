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
exports.UserBillingController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const subscription_service_1 = require("./subscription.service");
const entitlements_service_1 = require("./entitlements.service");
const usage_tracking_service_1 = require("./usage-tracking.service");
const billing_dto_1 = require("./dto/billing.dto");
let UserBillingController = class UserBillingController {
    constructor(subscriptionService, entitlementsService, usageTrackingService) {
        this.subscriptionService = subscriptionService;
        this.entitlementsService = entitlementsService;
        this.usageTrackingService = usageTrackingService;
    }
    async getMySubscription(req) {
        return this.subscriptionService.getActiveSubscription("USER", req.user.id);
    }
    async getMyEntitlements(req) {
        return this.entitlementsService.resolve("USER", req.user.id, process.env.NODE_ENV || "DEVELOPMENT");
    }
    async getMyUsage(req, dto) {
        return this.usageTrackingService.getUsageStats("USER", req.user.id, dto.range || "today");
    }
};
exports.UserBillingController = UserBillingController;
__decorate([
    (0, common_1.Get)("subscription"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get my current subscription" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserBillingController.prototype, "getMySubscription", null);
__decorate([
    (0, common_1.Get)("entitlements"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get my current entitlements" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UserBillingController.prototype, "getMyEntitlements", null);
__decorate([
    (0, common_1.Get)("usage"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get my usage stats" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, billing_dto_1.UsageRangeDto]),
    __metadata("design:returntype", Promise)
], UserBillingController.prototype, "getMyUsage", null);
exports.UserBillingController = UserBillingController = __decorate([
    (0, swagger_1.ApiTags)("user-billing"),
    (0, common_1.Controller)("me"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt")),
    __metadata("design:paramtypes", [subscription_service_1.SubscriptionService,
        entitlements_service_1.EntitlementsService,
        usage_tracking_service_1.UsageTrackingService])
], UserBillingController);
//# sourceMappingURL=user-billing.controller.js.map