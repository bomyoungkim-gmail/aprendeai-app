"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentShare = exports.SharePermission = exports.ShareContextType = void 0;
var ShareContextType;
(function (ShareContextType) {
    ShareContextType["CLASSROOM"] = "CLASSROOM";
    ShareContextType["STUDY_GROUP"] = "STUDY_GROUP";
    ShareContextType["FAMILY"] = "FAMILY";
    ShareContextType["PUBLIC"] = "PUBLIC";
})(ShareContextType || (exports.ShareContextType = ShareContextType = {}));
var SharePermission;
(function (SharePermission) {
    SharePermission["VIEW"] = "VIEW";
    SharePermission["EDIT"] = "EDIT";
    SharePermission["ASSIGN"] = "ASSIGN";
})(SharePermission || (exports.SharePermission = SharePermission = {}));
class ContentShare {
    constructor(contentId, contextType, contextId, permission, createdBy, createdAt = new Date()) {
        this.contentId = contentId;
        this.contextType = contextType;
        this.contextId = contextId;
        this.permission = permission;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
exports.ContentShare = ContentShare;
//# sourceMappingURL=content-share.entity.js.map