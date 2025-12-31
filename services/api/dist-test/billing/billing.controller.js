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
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("../admin/guards/roles.guard");
const roles_decorator_1 = require("../admin/decorators/roles.decorator");
const client_1 = require("@prisma/client");
const billing_service_1 = require("./billing.service");
const subscription_service_1 = require("./subscription.service");
const entitlements_service_1 = require("./entitlements.service");
const admin_service_1 = require("../admin/admin.service");
const billing_dto_1 = require("./dto/billing.dto");
let BillingController = class BillingController {
    constructor(billingService, subscriptionService, entitlementsService, adminService) {
        this.billingService = billingService;
        this.subscriptionService = subscriptionService;
        this.entitlementsService = entitlementsService;
        this.adminService = adminService;
    }
    async getPlans() {
        return this.billingService.getPlans();
    }
    async createPlan(dto, req) {
        const plan = await this.billingService.createPlan(dto);
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "PLAN_CREATED",
            resourceType: "PLAN",
            resourceId: plan.id,
            afterJson: { code: plan.code, name: plan.name },
        });
        return plan;
    }
    async updatePlan(id, dto, req) {
        const before = await this.billingService.getPlanById(id);
        const plan = await this.billingService.updatePlan(id, dto);
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "PLAN_UPDATED",
            resourceType: "PLAN",
            resourceId: id,
            beforeJson: { name: before.name, entitlements: before.entitlements },
            afterJson: { name: plan.name, entitlements: plan.entitlements },
        });
        return plan;
    }
    async deletePlan(id, req) {
        const plan = await this.billingService.deletePlan(id);
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "PLAN_DELETED",
            resourceType: "PLAN",
            resourceId: id,
            afterJson: { code: plan.code, isActive: false },
        });
        return { success: true, message: "Plan deactivated" };
    }
    async getSubscriptions(filters) {
        return this.subscriptionService.getSubscriptions(filters);
    }
    async getSubscription(id) {
        return this.subscriptionService.getSubscriptionById(id);
    }
    async assignPlan(dto, req) {
        const result = await this.billingService.createSubscription(req.user.id, "plan-id-placeholder", "price-id-placeholder");
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "SUBSCRIPTION_ASSIGNED",
            resourceType: "SUBSCRIPTION",
            resourceId: result.id,
            afterJson: { planId: result.planId, status: result.status },
            reason: dto.reason,
        });
        return result;
    }
    async cancelSubscription(dto, req) {
        const before = await this.subscriptionService.getSubscriptionById(dto.subscriptionId);
        await this.billingService.cancelSubscription(dto.subscriptionId);
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "SUBSCRIPTION_CANCELED",
            resourceType: "SUBSCRIPTION",
            resourceId: dto.subscriptionId,
            beforeJson: { status: before.status },
            afterJson: { status: "CANCELED" },
            reason: dto.reason,
        });
        return { success: true, status: "canceled" };
    }
    async previewEntitlements(dto) {
        return this.entitlementsService.resolve(dto.scopeType, dto.scopeId, process.env.NODE_ENV || "DEVELOPMENT");
    }
    async setOverrides(dto, req) {
        const before = await this.entitlementsService.getOverrides(dto.scopeType, dto.scopeId);
        const override = await this.entitlementsService.setOverrides(dto.scopeType, dto.scopeId, dto.overrides, dto.reason, req.user.id);
        await this.adminService.createAuditLog({
            actorUserId: req.user.id,
            actorRole: req.user.systemRole,
            action: "ENTITLEMENT_OVERRIDE_SET",
            resourceType: "ENTITLEMENT_OVERRIDE",
            resourceId: override.id,
            beforeJson: (before === null || before === void 0 ? void 0 : before.overrides) || null,
            afterJson: override.overrides,
            reason: dto.reason,
        });
        return override;
    }
    async removeOverrides(scopeType, scopeId, req) {
        const before = await this.entitlementsService.getOverrides(scopeType, scopeId);
        await this.entitlementsService.removeOverrides(scopeType, scopeId);
        if (before) {
            await this.adminService.createAuditLog({
                actorUserId: req.user.id,
                actorRole: req.user.systemRole,
                action: "ENTITLEMENT_OVERRIDE_REMOVED",
                resourceType: "ENTITLEMENT_OVERRIDE",
                resourceId: before.id,
                beforeJson: before.overrides,
            });
        }
        return { success: true, message: "Overrides removed" };
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Get)("plans"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all active plans" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)("plans"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Create new plan" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.CreatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)("plans/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Update plan" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, billing_dto_1.UpdatePlanDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)("plans/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Delete (deactivate) plan" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)("subscriptions"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get subscriptions with filters" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.SubscriptionFilterDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSubscriptions", null);
__decorate([
    (0, common_1.Get)("subscriptions/:id"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get subscription by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getSubscription", null);
__decorate([
    (0, common_1.Post)("subscriptions/assign"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Assign plan (upgrade/downgrade)" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.AssignPlanDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "assignPlan", null);
__decorate([
    (0, common_1.Post)("subscriptions/cancel"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Cancel subscription" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.CancelSubscriptionDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)("entitlements/preview"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN, client_1.SystemRole.OPS),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Preview entitlements for scope" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.PreviewEntitlementsDto]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "previewEntitlements", null);
__decorate([
    (0, common_1.Post)("overrides"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Set entitlement overrides" }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [billing_dto_1.SetOverridesDto, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "setOverrides", null);
__decorate([
    (0, common_1.Delete)("overrides/:scopeType/:scopeId"),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Remove entitlement overrides" }),
    __param(0, (0, common_1.Param)("scopeType")),
    __param(1, (0, common_1.Param)("scopeId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "removeOverrides", null);
exports.BillingController = BillingController = __decorate([
    (0, swagger_1.ApiTags)("admin-billing"),
    (0, common_1.Controller)("admin/billing"),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)("jwt"), roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService,
        subscription_service_1.SubscriptionService,
        entitlements_service_1.EntitlementsService,
        admin_service_1.AdminService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map