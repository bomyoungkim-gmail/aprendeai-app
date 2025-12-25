import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { RolesGuard } from "../admin/guards/roles.guard";
import { Roles } from "../admin/decorators/roles.decorator";
import { UserRole } from "@prisma/client";
import { BillingService } from "./billing.service";
import { SubscriptionService } from "./subscription.service";
import { EntitlementsService } from "./entitlements.service";
import { AdminService } from "../admin/admin.service";
import {
  CreatePlanDto,
  UpdatePlanDto,
  AssignPlanDto,
  CancelSubscriptionDto,
  SubscriptionFilterDto,
  PreviewEntitlementsDto,
  SetOverridesDto,
} from "./dto/billing.dto";

@ApiTags("admin-billing")
@Controller("admin/billing")
@UseGuards(AuthGuard("jwt"), RolesGuard)
export class BillingController {
  constructor(
    private billingService: BillingService,
    private subscriptionService: SubscriptionService,
    private entitlementsService: EntitlementsService,
    private adminService: AdminService,
  ) {}

  // ========================================
  // Plans Management
  // ========================================

  @Get("plans")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all active plans" })
  async getPlans() {
    return this.billingService.getPlans();
  }

  @Post("plans")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create new plan" })
  async createPlan(@Body() dto: CreatePlanDto, @Request() req) {
    const plan = await this.billingService.createPlan(dto);

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "PLAN_CREATED",
      resourceType: "PLAN",
      resourceId: plan.id,
      afterJson: { code: plan.code, name: plan.name },
    });

    return plan;
  }

  @Put("plans/:id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update plan" })
  async updatePlan(
    @Param("id") id: string,
    @Body() dto: UpdatePlanDto,
    @Request() req,
  ) {
    const before = await this.billingService.getPlanById(id);
    const plan = await this.billingService.updatePlan(id, dto);

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "PLAN_UPDATED",
      resourceType: "PLAN",
      resourceId: id,
      beforeJson: { name: before.name, entitlements: before.entitlements },
      afterJson: { name: plan.name, entitlements: plan.entitlements },
    });

    return plan;
  }

  @Delete("plans/:id")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete (deactivate) plan" })
  async deletePlan(@Param("id") id: string, @Request() req) {
    const plan = await this.billingService.deletePlan(id);

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "PLAN_DELETED",
      resourceType: "PLAN",
      resourceId: id,
      afterJson: { code: plan.code, isActive: false },
    });

    return { success: true, message: "Plan deactivated" };
  }

  // ========================================
  // Subscriptions Management
  // ========================================

  @Get("subscriptions")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subscriptions with filters" })
  async getSubscriptions(@Query() filters: SubscriptionFilterDto) {
    return this.subscriptionService.getSubscriptions(filters);
  }

  @Get("subscriptions/:id")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get subscription by ID" })
  async getSubscription(@Param("id") id: string) {
    return this.subscriptionService.getSubscriptionById(id);
  }

  @Post("subscriptions/assign")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Assign plan (upgrade/downgrade)" })
  async assignPlan(@Body() dto: AssignPlanDto, @Request() req) {
    const result = await this.subscriptionService.assignPlan(
      dto.scopeType,
      dto.scopeId,
      dto.planCode,
      req.user.userId,
      dto.reason,
    );

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "SUBSCRIPTION_ASSIGNED",
      resourceType: "SUBSCRIPTION",
      resourceId: result.subscription.id,
      beforeJson: result.before,
      afterJson: result.after,
      reason: dto.reason,
    });

    return result;
  }

  @Post("subscriptions/cancel")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cancel subscription" })
  async cancelSubscription(@Body() dto: CancelSubscriptionDto, @Request() req) {
    const before = await this.subscriptionService.getSubscriptionById(
      dto.subscriptionId,
    );
    const result = await this.subscriptionService.cancelSubscription(
      dto.subscriptionId,
      dto.cancelAtPeriodEnd || false,
      dto.reason,
    );

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "SUBSCRIPTION_CANCELED",
      resourceType: "SUBSCRIPTION",
      resourceId: dto.subscriptionId,
      beforeJson: { status: before.status },
      afterJson: { status: result.status },
      reason: dto.reason,
    });

    return result;
  }

  // ========================================
  // Entitlements & Overrides
  // ========================================

  @Get("entitlements/preview")
  @Roles(UserRole.ADMIN, UserRole.OPS)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Preview entitlements for scope" })
  async previewEntitlements(@Query() dto: PreviewEntitlementsDto) {
    return this.entitlementsService.resolve(
      dto.scopeType,
      dto.scopeId,
      (process.env.NODE_ENV as any) || "DEVELOPMENT",
    );
  }

  @Post("overrides")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Set entitlement overrides" })
  async setOverrides(@Body() dto: SetOverridesDto, @Request() req) {
    const before = await this.entitlementsService.getOverrides(
      dto.scopeType,
      dto.scopeId,
    );
    const override = await this.entitlementsService.setOverrides(
      dto.scopeType,
      dto.scopeId,
      dto.overrides,
      dto.reason,
      req.user.userId,
    );

    // Audit log
    await this.adminService.createAuditLog({
      actorUserId: req.user.userId,
      actorRole: req.user.role,
      action: "ENTITLEMENT_OVERRIDE_SET",
      resourceType: "ENTITLEMENT_OVERRIDE",
      resourceId: override.id,
      beforeJson: before?.overrides || null,
      afterJson: override.overrides,
      reason: dto.reason,
    });

    return override;
  }

  @Delete("overrides/:scopeType/:scopeId")
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Remove entitlement overrides" })
  async removeOverrides(
    @Param("scopeType") scopeType: string,
    @Param("scopeId") scopeId: string,
    @Request() req,
  ) {
    const before = await this.entitlementsService.getOverrides(
      scopeType as any,
      scopeId,
    );
    await this.entitlementsService.removeOverrides(scopeType as any, scopeId);

    // Audit log
    if (before) {
      await this.adminService.createAuditLog({
        actorUserId: req.user.userId,
        actorRole: req.user.role,
        action: "ENTITLEMENT_OVERRIDE_REMOVED",
        resourceType: "ENTITLEMENT_OVERRIDE",
        resourceId: before.id,
        beforeJson: before.overrides,
      });
    }

    return { success: true, message: "Overrides removed" };
  }
}
