import config from '@configs/base';
import logger from '@core/utils/logger';
import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
}

const sendResetTokenEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    let transporter;
    if (config.IS_PROD_ENV) {
      transporter = nodemailer.createTransport({
        service: config.EMAIL_SERVICE,
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD,
        },
      });
    } else {
      transporter = nodemailer.createTransport({
        host: config.DEV_EMAIL_HOST,
        port: config.DEV_EMAIL_PORT,
        secure: config.DEV_EMAIL_PORT === 465,
        auth: {
          user: config.DEV_EMAIL_USER,
          pass: config.DEV_EMAIL_PASSWORD,
        },
        logger: true,
        debug: true,
      });
    }
    const mailOptions = {
      from: `Anis App <solutions.anis@gmail.com>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      // html: ... (You can add HTML templates later)
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error('Email Send Error:', error);
    // Return false instead of throwing so the controller can handle it gracefully
    return false;
  }
};

export default sendResetTokenEmail;
