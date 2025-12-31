import { WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { EmailService } from "./email.service";
export interface EmailJob {
    type: "welcome" | "group-invitation" | "annotation-notification" | "study-reminder";
    data: any;
}
export declare class EmailProcessor extends WorkerHost {
    private readonly emailService;
    private readonly logger;
    constructor(emailService: EmailService);
    process(job: Job<EmailJob>): Promise<void>;
}
