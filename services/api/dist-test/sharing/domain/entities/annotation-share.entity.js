"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnnotationShare = exports.AnnotationShareMode = void 0;
var AnnotationShareMode;
(function (AnnotationShareMode) {
    AnnotationShareMode["READ_ONLY"] = "READ_ONLY";
    AnnotationShareMode["COLLABORATIVE"] = "COLLABORATIVE";
})(AnnotationShareMode || (exports.AnnotationShareMode = AnnotationShareMode = {}));
class AnnotationShare {
    constructor(annotationId, contextType, contextId, mode, createdBy, createdAt = new Date()) {
        this.annotationId = annotationId;
        this.contextType = contextType;
        this.contextId = contextId;
        this.mode = mode;
        this.createdBy = createdBy;
        this.createdAt = createdAt;
    }
}
exports.AnnotationShare = AnnotationShare;
//# sourceMappingURL=annotation-share.entity.js.map