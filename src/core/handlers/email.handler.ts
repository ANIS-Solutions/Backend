import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import config from '@/config/base';
import logger from '@/core/utils/logger';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_DIR = path.join(process.cwd(), 'public', 'emails');
// const src_path = path.join(__dirname, '..', '..', 'public', 'emails');

type EmailType = 'RESET_PASSWORD' | 'VERIFY_OTP' | 'REACTIVATE';
type IEmailData = Record<string, string | number>;
interface IEmailOptions {
  to: string;
  type: EmailType;
  data: IEmailData;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.IS_PROD_ENV ? config.EMAIL_SERVICE : undefined,
      host: config.IS_PROD_ENV ? config.EMAIL_HOST : config.DEV_EMAIL_HOST,
      port: config.IS_PROD_ENV ? config.EMAIL_PORT : config.DEV_EMAIL_PORT,
      secure: config.IS_PROD_ENV,
      auth: {
        user: config.IS_PROD_ENV ? config.EMAIL_USER : config.DEV_EMAIL_USER,
        pass: config.IS_PROD_ENV
          ? config.EMAIL_PASSWORD
          : config.DEV_EMAIL_PASSWORD,
      },
      pool: true,
      maxConnections: 5,
    });
  }

  private getSubject(template: EmailType): string {
    if (template === 'VERIFY_OTP') return 'Verify Your Account';
    else if (template === 'RESET_PASSWORD') return 'Reset Your Password';
    else if (template === 'REACTIVATE') return 'Welcome to ANIS Solutions!';
    return 'Notification from ANIS';
  }
  private async loadTemplate(
    templateName: EmailType,
    data: IEmailData,
  ): Promise<string> {
    try {
      const templatePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
      let htmlContent = await fs.readFile(templatePath, 'utf-8');
      // console.log(htmlContent);
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
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error('Email template loading failed');
    }
  }

  public async send(options: IEmailOptions): Promise<void> {
    const { to, type, data } = options;
    try {
      const html = await this.loadTemplate(type, data as unknown as IEmailData);
      const subject = this.getSubject(type);
      const sender = config.IS_PROD_ENV
        ? config.EMAIL_USER
        : config.DEV_EMAIL_USER;
      const mailOptions = {
        from: `"ANIS Solutions" <${sender}>`,
        to,
        subject,
        html,
        text: 'placeholder text',
      };
      await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${options.to} [${options.type}]`);
    } catch (error) {
      logger.error('Email Send Error:', error);
    }
  }
}

export const emailService = new EmailService();
