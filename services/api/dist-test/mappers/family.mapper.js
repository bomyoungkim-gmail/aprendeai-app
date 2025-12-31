"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FamilyMapper = void 0;
class FamilyMapper {
    static toDto(family) {
        var _a, _b, _c;
        if (!family)
            return null;
        return {
            id: family.id,
            name: family.name,
            joinCode: family.join_code,
            ownerUserId: family.owner_user_id,
            createdAt: family.created_at,
            updatedAt: family.updated_at,
            members: (_a = family.family_members) === null || _a === void 0 ? void 0 : _a.map((member) => {
                var _a, _b, _c;
                return ({
                    id: member.id,
                    userId: member.user_id,
                    role: member.role,
                    learningRole: member.learning_role,
                    status: member.status,
                    displayName: member.display_name,
                    joinedAt: member.joined_at,
                    user: {
                        id: (_a = member.users) === null || _a === void 0 ? void 0 : _a.id,
                        name: (_b = member.users) === null || _b === void 0 ? void 0 : _b.name,
                        email: (_c = member.users) === null || _c === void 0 ? void 0 : _c.email,
                    },
                });
            }),
            stats: {
                totalMembers: ((_b = family.family_members) === null || _b === void 0 ? void 0 : _b.length) || 0,
                activeMembers: ((_c = family.family_members) === null || _c === void 0 ? void 0 : _c.filter((m) => m.status === "ACTIVE").length) ||
                    0,
                plan: "Free",
            },
        };
    }
    static toCollectionDto(families) {
        return families.map((family) => this.toDto(family));
    }
}
exports.FamilyMapper = FamilyMapper;
//# sourceMappingURL=family.mapper.js.map