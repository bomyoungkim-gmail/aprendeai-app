"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const Handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const urls_config_1 = require("../config/urls.config");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
        this.templatesCache = new Map();
        this.initializeTransporter();
    }
    initializeTransporter() {
        const host = process.env.SMTP_HOST;
        const port = parseInt(process.env.SMTP_PORT || "587", 10);
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        if (!host || !user || !pass) {
            this.logger.warn("SMTP configuration not found. Email sending will be disabled.");
            return;
        }
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
        this.logger.log("Email transporter initialized");
    }
    async sendEmail(options) {
        if (!this.transporter) {
            this.logger.warn("Email transporter not configured. Skipping email.");
            return;
        }
        try {
            const html = await this.renderTemplate(options.template, options.context);
            const from = process.env.EMAIL_FROM || "AprendeAI <noreply@aprendeai.com>";
            const info = await this.transporter.sendMail({
                from,
                to: options.to,
                subject: options.subject,
                html,
            });
            this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
        }
        catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            throw error;
        }
    }
    async renderTemplate(templateName, context) {
        let template = this.templatesCache.get(templateName);
        if (!template) {
            const templatePath = path.join(__dirname, "templates", `${templateName}.hbs`);
            if (!fs.existsSync(templatePath)) {
                throw new Error(`Template not found: ${templateName}`);
            }
            const templateContent = fs.readFileSync(templatePath, "utf-8");
            template = Handlebars.compile(templateContent);
            this.templatesCache.set(templateName, template);
        }
        const fullContext = Object.assign(Object.assign({}, context), { frontendUrl: urls_config_1.URL_CONFIG.frontend.base, year: new Date().getFullYear() });
        return template(fullContext);
    }
    async sendWelcomeEmail(user) {
        await this.sendEmail({
            to: user.email,
            subject: "Bem-vindo ao AprendeAI! 🎉",
            template: "welcome",
            context: {
                userName: user.name,
                dashboardUrl: `${urls_config_1.URL_CONFIG.frontend.base}/dashboard`,
            },
        });
    }
    async sendGroupInvitationEmail(invitation) {
        await this.sendEmail({
            to: invitation.email,
            subject: `Convite para ${invitation.groupName} 👥`,
            template: "group-invitation",
            context: {
                inviterName: invitation.inviterName,
                groupName: invitation.groupName,
                groupDescription: invitation.groupDescription || "Participe deste grupo de estudo!",
                acceptUrl: `${urls_config_1.URL_CONFIG.frontend.base}/groups/invitations/${invitation.invitationId}`,
            },
        });
    }
    async sendAnnotationNotification(notification) {
        await this.sendEmail({
            to: notification.ownerEmail,
            subject: `Nova anotação em "${notification.contentTitle}" ✏️`,
            template: "annotation-notification",
            context: {
                ownerName: notification.ownerName,
                annotatorName: notification.annotatorName,
                contentTitle: notification.contentTitle,
                annotationText: notification.annotationText,
                contentUrl: `${urls_config_1.URL_CONFIG.frontend.base}/reader/${notification.contentId}`,
            },
        });
    }
    async sendStudyReminder(user) {
        await this.sendEmail({
            to: user.email,
            subject: "Hora de estudar! 📚",
            template: "study-reminder",
            context: {
                userName: user.name,
                streak: user.streak || 0,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
            },
        });
    }
    isAvailable() {
        return !!this.transporter;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], EmailService);
//# sourceMappingURL=email.service.js.map