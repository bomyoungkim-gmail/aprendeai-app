import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter
   */
  private initializeTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn('SMTP configuration not found. Email sending will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    this.logger.log('Email transporter initialized');
  }

  /**
   * Send email using template
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email transporter not configured. Skipping email.');
      return;
    }

    try {
      const html = await this.renderTemplate(options.template, options.context);

      const from = process.env.EMAIL_FROM || 'AprendeAI <noreply@aprendeai.com>';

      const info = await this.transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html,
      });

      this.logger.log(`Email sent to ${options.to}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Render email template
   */
  private async renderTemplate(
    templateName: string,
    context: Record<string, any>,
  ): Promise<string> {
    // Check cache first
    let template = this.templatesCache.get(templateName);

    if (!template) {
      // Load template from file
      const templatePath = path.join(
        __dirname,
        'templates',
        `${templateName}.hbs`,
      );

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      const templateContent = fs.readFileSync(templatePath, 'utf-8');
      template = Handlebars.compile(templateContent);
      
      // Cache template
      this.templatesCache.set(templateName, template);
    }

    // Add common context
    const fullContext = {
      ...context,
      frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
      year: new Date().getFullYear(),
    };

    return template(fullContext);
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.sendEmail({
      to: user.email,
      subject: 'Bem-vindo ao AprendeAI! 🎉',
      template: 'welcome',
      context: {
        userName: user.name,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      },
    });
  }

  /**
   * Send group invitation email
   */
  async sendGroupInvitationEmail(invitation: {
    email: string;
    inviterName: string;
    groupName: string;
    groupDescription?: string;
    invitationId: string;
  }) {
    await this.sendEmail({
      to: invitation.email,
      subject: `Convite para ${invitation.groupName} 👥`,
      template: 'group-invitation',
      context: {
        inviterName: invitation.inviterName,
        groupName: invitation.groupName,
        groupDescription: invitation.groupDescription || 'Participe deste grupo de estudo!',
        acceptUrl: `${process.env.FRONTEND_URL}/groups/invitations/${invitation.invitationId}`,
      },
    });
  }

  /**
   * Send annotation notification
   */
  async sendAnnotationNotification(notification: {
    ownerEmail: string;
    ownerName: string;
    annotatorName: string;
    contentTitle: string;
    annotationText: string;
    contentId: string;
  }) {
    await this.sendEmail({
      to: notification.ownerEmail,
      subject: `Nova anotação em "${notification.contentTitle}" ✏️`,
      template: 'annotation-notification',
      context: {
        ownerName: notification.ownerName,
        annotatorName: notification.annotatorName,
        contentTitle: notification.contentTitle,
        annotationText: notification.annotationText,
        contentUrl: `${process.env.FRONTEND_URL}/reader/${notification.contentId}`,
      },
    });
  }

  /**
   * Send study reminder
   */
  async sendStudyReminder(user: {
    email: string;
    name: string;
    streak?: number;
  }) {
    await this.sendEmail({
      to: user.email,
      subject: 'Hora de estudar! 📚',
      template: 'study-reminder',
      context: {
        userName: user.name,
        streak: user.streak || 0,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`,
      },
    });
  }

  /**
   * Check if email service is available
   */
  isAvailable(): boolean {
    return !!this.transporter;
  }
}
