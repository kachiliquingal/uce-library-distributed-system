import nodemailer from 'nodemailer';
import { logger } from '../../utils/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  public static initialize(): void {
    // Configured for Gmail SMTP using App Passwords
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_APP_PASSWORD || ''
      }
    });

    this.transporter.verify((error) => {
      if (error) {
        logger.error('[EmailService] SMTP connection error:', error);
      } else {
        logger.info('[EmailService] SMTP Server is ready to take our messages');
      }
    });
  }

  public static async sendNotificationEmail(subject: string, message: string, recipientRole: 'USER' | 'ADMIN'): Promise<void> {
    try {
      const testUserEmail = process.env.TEST_EMAIL_ADDRESS;
      const testAdminEmail = process.env.TEST_ADMIN_EMAIL_ADDRESS;

      if (!this.transporter) {
        logger.error('[EmailService] Transporter not initialized');
        return;
      }

      // 1. Send to User
      if (recipientRole === 'USER' && testUserEmail) {
        const mailOptionsUser = {
          from: `"Biblioteca UCE" <${process.env.EMAIL_USER}>`,
          to: testUserEmail,
          subject: `[Usuario] ${subject}`,
          html: this.generateHtmlTemplate(subject, message, 'Usuario de la Biblioteca')
        };
        await this.transporter.sendMail(mailOptionsUser);
        logger.info(`[EmailService] Sent email to user test address: ${testUserEmail}`);
      } else if (recipientRole === 'USER') {
        logger.warn('[EmailService] TEST_EMAIL_ADDRESS not defined in env');
      }

      // 2. Send to Admin
      if (recipientRole === 'ADMIN' && testAdminEmail) {
        const mailOptionsAdmin = {
          from: `"Biblioteca UCE (Sistema)" <${process.env.EMAIL_USER}>`,
          to: testAdminEmail,
          subject: `[Administrador] ${subject}`,
          html: this.generateHtmlTemplate(subject, message, 'Administrador')
        };
        await this.transporter.sendMail(mailOptionsAdmin);
        logger.info(`[EmailService] Sent email to admin test address: ${testAdminEmail}`);
      } else if (recipientRole === 'ADMIN') {
        logger.warn('[EmailService] TEST_ADMIN_EMAIL_ADDRESS not defined in env');
      }

    } catch (error) {
      logger.error('[EmailService] Error sending email:', error);
    }
  }

  private static generateHtmlTemplate(subject: string, message: string, recipientName: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-w-2xl mx-auto; p-6 bg-gray-50;">
        <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; border-top: 4px solid #4f46e5; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <h2 style="color: #1f2937; margin-top: 0; display: flex; align-items: center; gap: 10px;">
            📚 Sistema de Biblioteca UCE
          </h2>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          
          <p style="color: #4b5563; font-size: 16px;">Hola <strong>${recipientName}</strong>,</p>
          
          <h3 style="color: #374151; font-size: 18px; margin-top: 25px;">${subject}</h3>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="color: #1f2937; font-size: 15px; line-height: 1.6; margin: 0;">
              ${message}
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Este es un correo automático generado por la arquitectura de microservicios. No respondas a este mensaje.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="text-align: center; color: #9ca3af; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Universidad Central del Ecuador. Todos los derechos reservados.
          </p>
        </div>
      </div>
    `;
  }
}
