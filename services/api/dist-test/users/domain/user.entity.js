"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.UserContextRole = exports.UserSystemRole = void 0;
var UserSystemRole;
(function (UserSystemRole) {
    UserSystemRole["ADMIN"] = "ADMIN";
    UserSystemRole["SUPPORT"] = "SUPPORT";
    UserSystemRole["USER"] = "USER";
})(UserSystemRole || (exports.UserSystemRole = UserSystemRole = {}));
var UserContextRole;
(function (UserContextRole) {
    UserContextRole["OWNER"] = "OWNER";
    UserContextRole["ADMIN"] = "ADMIN";
    UserContextRole["TEACHER"] = "TEACHER";
    UserContextRole["STUDENT"] = "STUDENT";
    UserContextRole["PARENT"] = "PARENT";
    UserContextRole["MEMBER"] = "MEMBER";
})(UserContextRole || (exports.UserContextRole = UserContextRole = {}));
class User {
    constructor(props) {
        this.id = props.id;
        this.email = props.email;
        this.name = props.name;
        this._passwordHash = props.passwordHash;
        this.systemRole = props.systemRole;
        this.contextRole = props.contextRole;
        this.institutionId = props.institutionId;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }
    get passwordHash() {
        return this._passwordHash;
    }
    updateProfile(name) {
        this.name = name;
        this.updatedAt = new Date();
    }
    updateContext(role, institutionId) {
        this.contextRole = role;
        this.institutionId = institutionId !== null && institutionId !== void 0 ? institutionId : null;
        this.updatedAt = new Date();
    }
}
exports.User = User;
//# sourceMappingURL=user.entity.js.map