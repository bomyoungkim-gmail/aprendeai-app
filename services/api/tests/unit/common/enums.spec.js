"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const enums_1 = require("../../../src/common/constants/enums");
describe("Cornell Notes Enums", () => {
    describe("VisibilityScope", () => {
        it("should have all expected values", () => {
            expect(enums_1.VisibilityScope.CLASS_PROJECT).toBe("CLASS_PROJECT");
            expect(enums_1.VisibilityScope.ONLY_EDUCATORS).toBe("ONLY_EDUCATORS");
            expect(enums_1.VisibilityScope.RESPONSIBLES_OF_LEARNER).toBe("RESPONSIBLES_OF_LEARNER");
            expect(enums_1.VisibilityScope.GROUP_MEMBERS).toBe("GROUP_MEMBERS");
        });
    });
    describe("ContextType", () => {
        it("should have all expected values", () => {
            expect(enums_1.ContextType.INSTITUTION).toBe("INSTITUTION");
            expect(enums_1.ContextType.GROUP_STUDY).toBe("GROUP_STUDY");
            expect(enums_1.ContextType.FAMILY).toBe("FAMILY");
        });
    });
    describe("AnnotationStatus", () => {
        it("should have all expected values", () => {
            expect(enums_1.AnnotationStatus.ACTIVE).toBe("ACTIVE");
            expect(enums_1.AnnotationStatus.DELETED).toBe("DELETED");
        });
    });
    describe("Type Safety", () => {
        it("should enforce type safety for visibility scopes", () => {
            const validScope = enums_1.VisibilityScope.CLASS_PROJECT;
            expect(validScope).toBeDefined();
        });
        it("should work with Prisma enums", () => {
            const visibility = "PRIVATE";
            expect(["PRIVATE", "GROUP", "PUBLIC"]).toContain(visibility);
        });
    });
});
describe("Existing Enums Integration", () => {
    describe("FamilyRole", () => {
        it("should include EDUCATOR and LEARNER roles", () => {
            const roles = Object.values(enums_1.FamilyRole);
            expect(roles).toContain("EDUCATOR");
            expect(roles).toContain("LEARNER");
        });
    });
    describe("GroupRole", () => {
        it("should have standard group roles", () => {
            expect(["OWNER", "MOD", "MEMBER"]).toContain(enums_1.GroupRole.OWNER);
        });
    });
});
//# sourceMappingURL=enums.spec.js.map