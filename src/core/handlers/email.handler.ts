import fs from 'fs/promises';
import path from 'path';

import config from '@/config/base';
import logger from '@/core/utils/logger';
import { emailReasons, emailTypes } from '@anis/shared';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'emails');
const RESEND_FROM = 'ANIS Solutions <noreply@anis.solutions>';

type EmailType = emailTypes;
type IEmailData = Record<string, string | number>;
export interface IEmailOptions {
  to: string;
  type: EmailType;
  data: IEmailData;
}

class EmailService {
  private nodemailerTransporter: nodemailer.Transporter | null = null;
  private resendClient: Resend | null = null;

  constructor() {
    if (!config.IS_PROD_ENV) {
      this.resendClient = new Resend(config.RESEND_API);
      logger.info('[EmailService] Using Resend provider (production).');
    } else {
      this.nodemailerTransporter = nodemailer.createTransport({
        host: config.DEV_EMAIL_HOST,
        port: config.DEV_EMAIL_PORT,
        secure: false,
        auth: {
          user: config.DEV_EMAIL_USER,
          pass: config.DEV_EMAIL_PASSWORD,
        },
        pool: true,
        maxConnections: 5,
      });
      logger.info('[EmailService] Using Nodemailer provider (development).');
    }
  }

  private getSubject(template: EmailType): string {
    if (template === emailReasons.VERIFY_EMAIL) return 'Verify Your Account';
    if (template === emailReasons.VERIFY_OTP) return 'Verify Your Account';
    else if (template === 'RESET_PASSWORD') return 'Reset Your Password';
    else if (template === 'REACTIVATE') return 'Welcome to ANIS Solutions!';
    return 'Notification from ANIS';
  }

  private async loadTemplate(
    templateName: EmailType,
    data: IEmailData,
  ): Promise<string> {
    try {
      const templatePath = path.join(
        TEMPLATE_DIR,
        `${templateName.toString()}.html`,
      );
      let htmlContent = await fs.readFile(templatePath, 'utf-8');
      const finalData: IEmailData = {
        dashboard_url: '#',
        unsubscribe_url: '#',
        help_url: '#',
        twitter_url: '#',
        facebook_url: '#',
        linkedin_url: '#',
        ...data,
        year: new Date().getFullYear(),
      };
      Object.keys(finalData).forEach((key) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        htmlContent = htmlContent.replace(regex, String(finalData[key]));
      });

      return htmlContent;
    } catch (error) {
      logger.error(
        `Failed to load template ${templateName.toString()}:`,
        error,
      );
      throw new Error('Email template loading failed');
    }
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.resendClient) throw new Error('Resend client not initialized.');

    const { error } = await this.resendClient.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }

  private async sendViaNodemailer(
    to: string,
    subject: string,
    html: string,
  ): Promise<void> {
    if (!this.nodemailerTransporter)
      throw new Error('Nodemailer transporter not initialized.');

    await this.nodemailerTransporter.sendMail({
      from: `"ANIS Solutions" <${config.DEV_EMAIL_USER}>`,
      to,
      subject,
      html,
      text: 'placeholder text',
    });
  }

  public async send(options: IEmailOptions): Promise<void> {
    const { to, type, data } = options;
    try {
      const html = await this.loadTemplate(type, data as unknown as IEmailData);
      const subject = this.getSubject(type);

      if (!config.IS_PROD_ENV) {
        await this.sendViaResend(to, subject, html);
      } else {
        await this.sendViaNodemailer(to, subject, html);
      }

      logger.info(`Email sent to ${to} [${type.toString()}]`);
    } catch (error) {
      logger.error('Email Send Error:', error);
    }
  }
}

export const emailService = new EmailService();
