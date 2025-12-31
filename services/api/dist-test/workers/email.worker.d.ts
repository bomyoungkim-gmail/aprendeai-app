import { EmailService } from "../email/email.service";
import { IFamilyRepository } from "../family/domain/family.repository.interface";
export declare class EmailWorker {
    private readonly familyRepository;
    private readonly emailService;
    private readonly logger;
    constructor(familyRepository: IFamilyRepository, emailService: EmailService);
    handleWeeklyReports(): Promise<void>;
}
