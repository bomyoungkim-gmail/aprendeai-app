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
var EntitlementsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntitlementsService = exports.FREE_LIMITS = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const subscription_service_1 = require("./subscription.service");
exports.FREE_LIMITS = {
    storageMb: 100,
    projects: 1,
    collaborators: 0,
    canExport: false,
};
let EntitlementsService = EntitlementsService_1 = class EntitlementsService {
    constructor(prisma, subscriptionService) {
        this.prisma = prisma;
        this.subscriptionService = subscriptionService;
        this.logger = new common_1.Logger(EntitlementsService_1.name);
    }
    async computeEntitlements(userId) {
        const user = await this.prisma.users.findUnique({
            where: { id: userId },
            include: {
                institution_members: {
                    include: {
                        institutions: {
                            include: {
                                subscriptions: {
                                    where: {
                                        status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
                                    },
                                    include: { plans: true },
                                    orderBy: { created_at: "desc" },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
                family_members: {
                    include: {
                        families: {
                            include: {
                                subscriptions: {
                                    where: {
                                        status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
                                    },
                                    include: { plans: true },
                                    orderBy: { created_at: "desc" },
                                    take: 1,
                                },
                            },
                        },
                    },
                    where: { status: "ACTIVE" },
                },
                subscriptions: {
                    where: { status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] } },
                    include: { plans: true },
                    orderBy: { created_at: "desc" },
                    take: 1,
                },
            },
        });
        if (!user) {
            return {
                source: "FREE",
                planType: "FREE",
                limits: exports.FREE_LIMITS,
                features: {},
            };
        }
        if (user.institution_members) {
            const membership = user.institution_members;
            if (membership.status === "ACTIVE") {
                const sub = membership.institutions.subscriptions[0];
                if (sub) {
                    return {
                        source: "ORG",
                        planType: "INSTITUTION",
                        limits: sub.plans.entitlements["limits"] || {},
                        features: sub.plans.entitlements["features"] || {},
                    };
                }
            }
        }
        for (const membership of user.family_members) {
            const sub = membership.families.subscriptions[0];
            if (sub) {
                return {
                    source: "FAMILY",
                    planType: "FAMILY",
                    limits: sub.plans.entitlements["limits"] || {},
                    features: sub.plans.entitlements["features"] || {},
                };
            }
        }
        const individualSub = user.subscriptions[0];
        if (individualSub) {
            return {
                source: "INDIVIDUAL",
                planType: individualSub.plans.type,
                limits: individualSub.plans.entitlements["limits"] || {},
                features: individualSub.plans.entitlements["features"] || {},
            };
        }
        const freePlan = await this.prisma.plans.findUnique({
            where: { code: "FREE" },
        });
        const freeLimits = (freePlan === null || freePlan === void 0 ? void 0 : freePlan.entitlements)
            ? freePlan.entitlements["limits"]
            : exports.FREE_LIMITS;
        const freeFeatures = (freePlan === null || freePlan === void 0 ? void 0 : freePlan.entitlements)
            ? freePlan.entitlements["features"]
            : {};
        return {
            source: "FREE",
            planType: "FREE",
            limits: freeLimits,
            features: freeFeatures,
        };
    }
    async resolve(scopeType, scopeId, environment) {
        if (scopeType === "USER") {
            return this.resolveUser(scopeId);
        }
        const sub = await this.prisma.subscriptions.findFirst({
            where: {
                scope_type: scopeType,
                scope_id: scopeId,
                status: { in: ["ACTIVE", "TRIALING", "GRACE_PERIOD"] },
            },
            include: { plans: true },
            orderBy: { created_at: "desc" },
        });
        if (sub) {
            return {
                source: "DIRECT",
                planType: sub.plans.type,
                limits: sub.plans.entitlements["limits"] || {},
                features: sub.plans.entitlements["features"] || {},
            };
        }
        return {
            source: "DEFAULT",
            planType: "FREE",
            limits: exports.FREE_LIMITS,
            features: {},
        };
    }
    async getEntitlement(userId, scopeType = client_1.EntitlementScopeType.USER, scopeId) {
        const effectiveScopeId = scopeId || userId;
        const snapshot = await this.prisma.entitlement_snapshots.findFirst({
            where: {
                user_id: userId,
                scope_type: scopeType,
                scope_id: effectiveScopeId,
            },
            orderBy: { expires_at: "desc" },
        });
        if (snapshot && snapshot.expires_at && snapshot.expires_at > new Date()) {
            return snapshot;
        }
        if (scopeType !== client_1.EntitlementScopeType.USER) {
            return this.getEntitlement(userId, client_1.EntitlementScopeType.USER, userId);
        }
        return this.refreshSnapshot(userId);
    }
    async resolveUser(userId) {
        const snapshot = await this.prisma.entitlement_snapshots.findFirst({
            where: {
                user_id: userId,
                scope_type: client_1.EntitlementScopeType.USER,
            },
            orderBy: { expires_at: "desc" },
        });
        if (!snapshot ||
            (snapshot.expires_at && snapshot.expires_at < new Date())) {
            return await this.refreshSnapshot(userId);
        }
        return snapshot;
    }
    async setOverrides(scopeType, scopeId, overrides, reason, adminUserId) {
        return this.prisma.entitlement_overrides.upsert({
            where: {
                scope_type_scope_id: {
                    scope_type: scopeType,
                    scope_id: scopeId,
                },
            },
            create: {
                scope_type: scopeType,
                scope_id: scopeId,
                overrides,
                reason,
                updated_by: adminUserId,
            },
            update: {
                overrides,
                reason,
                updated_by: adminUserId,
            },
        });
    }
    async removeOverrides(scopeType, scopeId) {
        try {
            await this.prisma.entitlement_overrides.delete({
                where: {
                    scope_type_scope_id: {
                        scope_type: scopeType,
                        scope_id: scopeId,
                    },
                },
            });
        }
        catch (error) { }
    }
    async getOverrides(scopeType, scopeId) {
        return this.prisma.entitlement_overrides.findUnique({
            where: {
                scope_type_scope_id: {
                    scope_type: scopeType,
                    scope_id: scopeId,
                },
            },
        });
    }
    async refreshSnapshot(userId) {
        const computed = await this.computeEntitlements(userId);
        const { v4: uuidv4 } = require("uuid");
        return this.prisma.entitlement_snapshots.upsert({
            where: {
                user_id_scope_type_scope_id: {
                    user_id: userId,
                    scope_type: client_1.EntitlementScopeType.USER,
                    scope_id: userId,
                },
            },
            create: {
                id: uuidv4(),
                updated_at: new Date(),
                users: { connect: { id: userId } },
                source: computed.source,
                plan_type: computed.planType,
                limits: computed.limits || {},
                features: computed.features || {},
                scope_type: client_1.EntitlementScopeType.USER,
                scope_id: userId,
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
            update: {
                source: computed.source,
                plan_type: computed.planType,
                limits: computed.limits || {},
                features: computed.features || {},
                updated_at: new Date(),
                expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
        });
    }
    async forceRefreshForScope(scopeType, scopeId) {
        this.logger.log(`Forcing entitlement refresh for ${scopeType}:${scopeId}`);
        if (scopeType === client_1.EntitlementScopeType.USER) {
            await this.refreshSnapshot(scopeId);
        }
        else if (scopeType === client_1.EntitlementScopeType.FAMILY) {
            const members = await this.prisma.family_members.findMany({
                where: { family_id: scopeId },
            });
            for (const m of members)
                await this.refreshSnapshot(m.user_id);
        }
    }
};
exports.EntitlementsService = EntitlementsService;
exports.EntitlementsService = EntitlementsService = EntitlementsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_service_1.SubscriptionService])
], EntitlementsService);
//# sourceMappingURL=entitlements.service.js.map