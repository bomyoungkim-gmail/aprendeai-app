"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationStatus = exports.ContextType = exports.VisibilityScope = exports.FamilyMemberStatus = exports.GroupMemberStatus = exports.GroupRole = exports.FamilyRole = exports.TargetType = exports.ContentType = exports.AnnotationVisibility = void 0;
const client_1 = require("@prisma/client");
Object.defineProperty(exports, "AnnotationVisibility", { enumerable: true, get: function () { return client_1.AnnotationVisibility; } });
Object.defineProperty(exports, "ContentType", { enumerable: true, get: function () { return client_1.ContentType; } });
Object.defineProperty(exports, "TargetType", { enumerable: true, get: function () { return client_1.TargetType; } });
Object.defineProperty(exports, "FamilyRole", { enumerable: true, get: function () { return client_1.FamilyRole; } });
Object.defineProperty(exports, "GroupRole", { enumerable: true, get: function () { return client_1.GroupRole; } });
Object.defineProperty(exports, "GroupMemberStatus", { enumerable: true, get: function () { return client_1.GroupMemberStatus; } });
Object.defineProperty(exports, "FamilyMemberStatus", { enumerable: true, get: function () { return client_1.FamilyMemberStatus; } });
var VisibilityScope;
(function (VisibilityScope) {
    VisibilityScope["CLASS_PROJECT"] = "CLASS_PROJECT";
    VisibilityScope["ONLY_EDUCATORS"] = "ONLY_EDUCATORS";
    VisibilityScope["RESPONSIBLES_OF_LEARNER"] = "RESPONSIBLES_OF_LEARNER";
    VisibilityScope["GROUP_MEMBERS"] = "GROUP_MEMBERS";
})(VisibilityScope || (exports.VisibilityScope = VisibilityScope = {}));
var ContextType;
(function (ContextType) {
    ContextType["INSTITUTION"] = "INSTITUTION";
    ContextType["GROUP_STUDY"] = "GROUP_STUDY";
    ContextType["FAMILY"] = "FAMILY";
})(ContextType || (exports.ContextType = ContextType = {}));
var AnnotationStatus;
(function (AnnotationStatus) {
    AnnotationStatus["ACTIVE"] = "ACTIVE";
    AnnotationStatus["DELETED"] = "DELETED";
})(AnnotationStatus || (exports.AnnotationStatus = AnnotationStatus = {}));
//# sourceMappingURL=enums.js.map