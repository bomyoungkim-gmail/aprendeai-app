import { families, family_members, users } from "@prisma/client";

export class FamilyMapper {
  static toDto(
    family: families & {
      family_members?: (family_members & { users: users })[];
    },
  ) {
    if (!family) return null;

    return {
      id: family.id,
      name: family.name,
      joinCode: family.join_code,
      ownerUserId: (family as any).owner_user_id,
      createdAt: family.created_at,
      updatedAt: family.updated_at,
      members: family.family_members?.map((member) => ({
        id: member.id,
        userId: member.user_id,
        role: member.role,
        learningRole: (member as any).learning_role,
        status: member.status,
        displayName: member.display_name,
        joinedAt: member.joined_at,
        user: {
          id: (member as any).users?.id,
          name: (member as any).users?.name,
          email: (member as any).users?.email,
        },
      })),
      stats: {
        totalMembers: family.family_members?.length || 0,
        activeMembers:
          family.family_members?.filter((m) => m.status === "ACTIVE").length ||
          0,
        plan: "Free",
      },
    };
  }

  static toCollectionDto(families: families[]) {
    return families.map((family) => this.toDto(family as any));
  }
}
