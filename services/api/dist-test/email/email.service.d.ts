export interface EmailOptions {
    to: string;
    subject: string;
    template: string;
    context: Record<string, any>;
}
export declare class EmailService {
    private readonly logger;
    private transporter;
    private templatesCache;
    constructor();
    private initializeTransporter;
    sendEmail(options: EmailOptions): Promise<void>;
    private renderTemplate;
    sendWelcomeEmail(user: {
        email: string;
        name: string;
    }): Promise<void>;
    sendGroupInvitationEmail(invitation: {
        email: string;
        inviterName: string;
        groupName: string;
        groupDescription?: string;
        invitationId: string;
    }): Promise<void>;
    sendAnnotationNotification(notification: {
        ownerEmail: string;
        ownerName: string;
        annotatorName: string;
        contentTitle: string;
        annotationText: string;
        contentId: string;
    }): Promise<void>;
    sendStudyReminder(user: {
        email: string;
        name: string;
        streak?: number;
    }): Promise<void>;
    isAvailable(): boolean;
}
