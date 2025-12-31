"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserMapper = void 0;
const user_entity_1 = require("../domain/user.entity");
class UserMapper {
    static toDomain(raw) {
        return new user_entity_1.User({
            id: raw.id,
            email: raw.email,
            name: raw.name,
            passwordHash: raw.password_hash,
            systemRole: raw.system_role,
            contextRole: raw.last_context_role,
            institutionId: raw.last_institution_id,
            createdAt: raw.created_at,
            updatedAt: raw.updated_at,
        });
    }
    static toDto(user) {
        if (!user)
            return null;
        if (user.systemRole) {
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                systemRole: user.systemRole,
                contextRole: user.contextRole,
                institution_id: user.institutionId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            systemRole: user.system_role,
            contextRole: user.last_context_role,
            institutionId: user.last_institution_id,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
    }
}
exports.UserMapper = UserMapper;
//# sourceMappingURL=user.mapper.js.map