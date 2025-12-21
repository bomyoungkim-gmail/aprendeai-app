
import { Test, TestingModule } from '@nestjs/testing';
import { FamilyService } from '../../src/family/family.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SubscriptionService } from '../../src/billing/subscription.service';
import { UsageTrackingService } from '../../src/billing/usage-tracking.service';
import { EnforcementService } from '../../src/billing/enforcement.service';
import { EmailService } from '../../src/email/email.service';
import { FamilyRole, FamilyMemberStatus, ScopeType } from '@prisma/client';

describe('FamilyService - Primary Family Logic', () => {
    let service: FamilyService;
    let prismaService: any; // Using any to avoid strict typing issues with mocks
    let subscriptionService: any;
    let emailService: any;

    const mockPrismaService = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        family: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        familyMember: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const mockSubscriptionService = {
        createInitialSubscription: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                FamilyService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: SubscriptionService, useValue: mockSubscriptionService },
                { provide: UsageTrackingService, useValue: {} },
                { provide: EnforcementService, useValue: {} },
                { provide: EmailService, useValue: { sendEmail: jest.fn() } },
            ],
        }).compile();

        service = module.get<FamilyService>(FamilyService);
        prismaService = module.get(PrismaService);
        subscriptionService = module.get(SubscriptionService);

        jest.clearAllMocks();
    });

    describe('create()', () => {
        const userId = 'user-123';
        const dto = { name: 'New Family' };
        const createdFamily = {
            id: 'family-id',
            name: dto.name,
            ownerId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        it('should create family and auto-set as primaryFamilyId', async () => {
            // Mock family creation
            prismaService.family.create.mockResolvedValue(createdFamily);

            // Mock user settings retrieval
            prismaService.user.findUnique.mockResolvedValue({
                id: userId,
                settings: {}, // No existing primary
            });

            await service.create(userId, dto);

            // Verify db calls
            expect(prismaService.family.create).toHaveBeenCalled();

            // Verify Subscription creation
            expect(subscriptionService.createInitialSubscription).toHaveBeenCalledWith(
                'FAMILY',
                createdFamily.id,
                expect.anything() // transaction client
            );

            // Verify User Update (Auto-Primary Rule)
            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: expect.objectContaining({
                    settings: expect.objectContaining({
                        primaryFamilyId: createdFamily.id,
                    }),
                }),
            });
        });

        it('should overwrite existing primaryFamilyId on creation', async () => {
            prismaService.family.create.mockResolvedValue(createdFamily);

            prismaService.user.findUnique.mockResolvedValue({
                id: userId,
                settings: { primaryFamilyId: 'old-family-id' },
            });

            await service.create(userId, dto);

            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: expect.objectContaining({
                    settings: expect.objectContaining({
                        primaryFamilyId: createdFamily.id, // Should be the NEW family
                    }),
                }),
            });
        });
    });

    describe('acceptInvite()', () => {
        const familyId = 'family-123';
        const userId = 'user-123';
        const memberId = 'member-id';

        const mockMember = {
            id: memberId,
            familyId,
            userId,
            role: FamilyRole.CHILD, // Using valid role
            status: FamilyMemberStatus.INVITED,
        };

        it('should accept invite and set Primary if user has none', async () => {
            // Mock member found
            prismaService.familyMember.findUnique.mockResolvedValue(mockMember);
            // Mock update status
            prismaService.familyMember.update.mockResolvedValue({ ...mockMember, status: 'ACTIVE' });

            // Mock user settings (NONE)
            prismaService.user.findUnique.mockResolvedValue({
                id: userId,
                settings: {},
            });

            await service.acceptInvite(familyId, userId);

            // Verify status update
            expect(prismaService.familyMember.update).toHaveBeenCalledWith({
                where: { id: memberId },
                data: { status: 'ACTIVE' },
            });

            // Verify User Update (Auto-Primary)
            expect(prismaService.user.update).toHaveBeenCalledWith({
                where: { id: userId },
                data: {
                    settings: { primaryFamilyId: familyId },
                },
            });
        });

        it('should accept invite but NOT change Primary if already set', async () => {
            // Mock member found
            prismaService.familyMember.findUnique.mockResolvedValue(mockMember);
            // Mock update status
            prismaService.familyMember.update.mockResolvedValue({ ...mockMember, status: 'ACTIVE' });

            // Mock user settings (EXISTING)
            prismaService.user.findUnique.mockResolvedValue({
                id: userId,
                settings: { primaryFamilyId: 'other-family' },
            });

            await service.acceptInvite(familyId, userId);

            // Verify status update
            expect(prismaService.familyMember.update).toHaveBeenCalled();

            // Verify User Update NOT called for settings
            expect(prismaService.user.update).not.toHaveBeenCalled();
        });
    });
});
