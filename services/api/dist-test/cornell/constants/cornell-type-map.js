"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CORNELL_TYPE_TAGS = exports.CORNELL_TYPE_COLOR_MAP = void 0;
exports.getColorForType = getColorForType;
exports.getTagsForType = getTagsForType;
exports.isValidCornellType = isValidCornellType;
exports.CORNELL_TYPE_COLOR_MAP = {
    HIGHLIGHT: "blue",
    NOTE: "green",
    STAR: "yellow",
    QUESTION: "red",
    SUMMARY: "yellow",
};
exports.CORNELL_TYPE_TAGS = {
    HIGHLIGHT: ["highlight"],
    NOTE: ["note"],
    STAR: ["star", "important"],
    QUESTION: ["question"],
    SUMMARY: ["summary"],
    AI_RESPONSE: ["ai-response"],
};
function getColorForType(type) {
    return (exports.CORNELL_TYPE_COLOR_MAP[type] ||
        "blue");
}
function getTagsForType(type) {
    return exports.CORNELL_TYPE_TAGS[type] || [];
}
function isValidCornellType(type) {
    return [
        "HIGHLIGHT",
        "NOTE",
        "STAR",
        "QUESTION",
        "SUMMARY",
        "AI_RESPONSE",
    ].includes(type);
}
//# sourceMappingURL=cornell-type-map.js.map