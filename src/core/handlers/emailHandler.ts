import fs from 'fs';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

import config from '@configs/base';
import logger from '@core/utils/logger';
import nodemailer from 'nodemailer';

const src_path = config.IS_DEV_ENV
  ? dirname(dirname(fileURLToPath(import.meta.url)))
  : path.join(
      dirname(dirname(dirname(fileURLToPath(import.meta.url)))),
      './src',
    );

type EmailType = 'RESET_PASSWORD' | 'VERIFY_OTP' | 'REACTIVATE';

interface IEmailOptions {
  to: string;
  type: EmailType;
  data: {
    name?: string;
    otp?: string;
    url?: string;
    [key: string]: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: config.IS_PROD_ENV ? config.EMAIL_SERVICE : undefined,
      host: config.IS_PROD_ENV ? config.EMAIL_HOST : config.DEV_EMAIL_HOST,
      port: config.IS_PROD_ENV ? config.EMAIL_PORT : config.DEV_EMAIL_PORT,
      secure: config.IS_PROD_ENV ? true : false,
      auth: {
        user: config.IS_PROD_ENV ? config.EMAIL_USER : config.DEV_EMAIL_USER,
        pass: config.IS_PROD_ENV
          ? config.EMAIL_PASSWORD
          : config.DEV_EMAIL_PASSWORD,
      },
    });
  }

  private getSubject(template: EmailType): string {
    if (template === 'VERIFY_OTP') return 'Verify Your Account';
    else if (template === 'RESET_PASSWORD') return 'Reset Your Password';
    else if (template === 'REACTIVATE') return 'Welcome to ANIS Solutions!';
    return '';
  }

  private loadTemplate(
    templateName: EmailType,
    data: Record<string, string>,
  ): string {
    try {
      const templatePath = path.join(
        src_path,
        `./templates/${templateName}.html`,
      );
      let htmlContent = fs.readFileSync(templatePath, 'utf-8');
      data.year = `${new Date().getFullYear()}`;
      Object.keys(data).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, data[key]!);
      });

      return htmlContent;
    } catch (error) {
      logger.error(`Failed to load template ${templateName}:`, error);
      throw new Error('Email template loading failed');
    }
  }

  public async send(options: IEmailOptions): Promise<boolean> {
    try {
      const html = this.loadTemplate(options.type, options.data);
      const subject = this.getSubject(options.type);

      const senderEmail = config.IS_PROD_ENV
        ? config.EMAIL_USER
        : config.DEV_EMAIL_USER;

      await this.transporter.sendMail({
        from: `ANIS Solutions <${senderEmail}>`,
        to: options.to,
        subject,
        html,
        text: 'placeholder text',
      });

      logger.info(`Email sent to ${options.to} [${options.type}]`);
      return true;
    } catch (error) {
      logger.error('Email Send Error:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
