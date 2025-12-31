import { AnnotationVisibility, ContentType, TargetType, FamilyRole, GroupRole, GroupMemberStatus, FamilyMemberStatus } from "@prisma/client";
export { AnnotationVisibility, ContentType, TargetType, FamilyRole, GroupRole, GroupMemberStatus, FamilyMemberStatus, };
export declare enum VisibilityScope {
    CLASS_PROJECT = "CLASS_PROJECT",
    ONLY_EDUCATORS = "ONLY_EDUCATORS",
    RESPONSIBLES_OF_LEARNER = "RESPONSIBLES_OF_LEARNER",
    GROUP_MEMBERS = "GROUP_MEMBERS"
}
export declare enum ContextType {
    INSTITUTION = "INSTITUTION",
    GROUP_STUDY = "GROUP_STUDY",
    FAMILY = "FAMILY"
}
export declare enum AnnotationStatus {
    ACTIVE = "ACTIVE",
    DELETED = "DELETED"
}
