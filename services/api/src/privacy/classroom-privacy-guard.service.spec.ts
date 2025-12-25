import { Test, TestingModule } from "@nestjs/testing";
import { ClassroomPrivacyGuard } from "./classroom-privacy-guard.service";
import { ClassPrivacyMode, StudentData } from "./types";

describe("ClassroomPrivacyGuard", () => {
  let service: ClassroomPrivacyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClassroomPrivacyGuard],
    }).compile();

    service = module.get<ClassroomPrivacyGuard>(ClassroomPrivacyGuard);
  });

  const mockStudentData: StudentData = {
    learnerUserId: "student_123",
    nickname: "Maria",
    progressPercent: 65,
    lastActivityDate: new Date("2025-01-15"),
    comprehensionScore: 72,
    helpRequests: [{ topic: "vocabulary", timestamp: "2025-01-14" }],
    struggles: ["complex grammar", "inference"],
  };

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("filterStudentData - AGGREGATED_ONLY", () => {
    it("should show only basic progress", () => {
      const filtered = service.filterStudentData(
        mockStudentData,
        ClassPrivacyMode.AGGREGATED_ONLY,
      );

      // Should include basic info
      expect(filtered.learnerUserId).toBe("student_123");
      expect(filtered.nickname).toBe("Maria");
      expect(filtered.progressPercent).toBe(65);
      expect(filtered.lastActivityDate).toEqual(new Date("2025-01-15"));

      // Should exclude sensitive data
      expect(filtered.comprehensionScore).toBeUndefined();
      expect(filtered.helpRequests).toBeUndefined();
      expect(filtered.struggles).toBeUndefined();
    });
  });

  describe("filterStudentData - AGGREGATED_PLUS_HELP_REQUESTS", () => {
    it("should show basic progress + help requests", () => {
      const filtered = service.filterStudentData(
        mockStudentData,
        ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS,
      );

      // Should include basic info + help requests
      expect(filtered.progressPercent).toBe(65);
      expect(filtered.helpRequests).toBeDefined();
      expect(filtered.helpRequests?.length).toBe(1);

      // Should still hide comprehension scores and struggles
      expect(filtered.comprehensionScore).toBeUndefined();
      expect(filtered.struggles).toBeUndefined();
    });
  });

  describe("filterStudentData - AGGREGATED_PLUS_FLAGS", () => {
    it("should show basic progress + risk indicators", () => {
      const filtered = service.filterStudentData(
        mockStudentData,
        ClassPrivacyMode.AGGREGATED_PLUS_FLAGS,
      );

      // Should include basic info + risk data
      expect(filtered.progressPercent).toBe(65);
      expect(filtered.comprehensionScore).toBe(72);
      expect(filtered.struggles).toEqual(["complex grammar", "inference"]);
    });
  });

  describe("filterStudentList", () => {
    it("should filter multiple students consistently", () => {
      const students: StudentData[] = [
        mockStudentData,
        { ...mockStudentData, learnerUserId: "student_456", nickname: "João" },
      ];

      const filtered = service.filterStudentList(
        students,
        ClassPrivacyMode.AGGREGATED_ONLY,
      );

      expect(filtered.length).toBe(2);
      expect(filtered[0].comprehensionScore).toBeUndefined();
      expect(filtered[1].comprehensionScore).toBeUndefined();
    });
  });

  describe("canViewStudentDetails", () => {
    it("should return false for AGGREGATED_ONLY", () => {
      expect(
        service.canViewStudentDetails(ClassPrivacyMode.AGGREGATED_ONLY),
      ).toBe(false);
    });

    it("should return true for AGGREGATED_PLUS_HELP_REQUESTS", () => {
      expect(
        service.canViewStudentDetails(
          ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS,
        ),
      ).toBe(true);
    });

    it("should return true for AGGREGATED_PLUS_FLAGS", () => {
      expect(
        service.canViewStudentDetails(ClassPrivacyMode.AGGREGATED_PLUS_FLAGS),
      ).toBe(true);
    });
  });

  describe("shouldRevealDetailsOnHelpRequest", () => {
    it("should return true only for AGGREGATED_PLUS_HELP_REQUESTS", () => {
      expect(
        service.shouldRevealDetailsOnHelpRequest(
          ClassPrivacyMode.AGGREGATED_PLUS_HELP_REQUESTS,
        ),
      ).toBe(true);

      expect(
        service.shouldRevealDetailsOnHelpRequest(
          ClassPrivacyMode.AGGREGATED_ONLY,
        ),
      ).toBe(false);

      expect(
        service.shouldRevealDetailsOnHelpRequest(
          ClassPrivacyMode.AGGREGATED_PLUS_FLAGS,
        ),
      ).toBe(false);
    });
  });
});
