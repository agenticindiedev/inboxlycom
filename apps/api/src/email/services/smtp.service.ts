import { Attachment, EmailAddress } from '@ai-email/shared';
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailAccount } from '../schemas/account.schema';



@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);

  /**
   * Create SMTP transporter for account
   */
  async createTransporter(account: EmailAccount): Promise<nodemailer.Transporter> {
    const config: any = {
      host: account.smtpConfig?.host || this.getDefaultSmtpHost(account.provider),
      port: account.smtpConfig?.port || this.getDefaultSmtpPort(account.provider),
      secure: account.smtpConfig?.secure ?? true,
      auth: {
        user: account.email,
        pass: this.decryptCredentials(account.encryptedCredentials),
      },
    };

    // OAuth2 support for Gmail
    if (account.oauth2Tokens && account.provider === 'gmail') {
      config.auth = {
        type: 'OAuth2',
        user: account.email,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        refreshToken: account.oauth2Tokens.refreshToken,
        accessToken: account.oauth2Tokens.accessToken,
      };
    }

    return nodemailer.createTransport(config);
  }

  /**
   * Send email
   */
  async sendEmail(
    account: EmailAccount,
    to: EmailAddress[],
    subject: string,
    body: { text?: string; html?: string },
    options?: {
      cc?: EmailAddress[];
      bcc?: EmailAddress[];
      replyTo?: EmailAddress;
      attachments?: Attachment[];
      inReplyTo?: string;
      references?: string[];
    }
  ): Promise<string> {
    const transporter = await this.createTransporter(account);

    const mailOptions: nodemailer.SendMailOptions = {
      from: {
        name: account.email.split('@')[0],
        address: account.email,
      },
      to: to.map((addr) => (addr.name ? `${addr.name} <${addr.address}>` : addr.address)),
      subject,
      text: body.text,
      html: body.html,
      cc: options?.cc?.map((addr) => (addr.name ? `${addr.name} <${addr.address}>` : addr.address)),
      bcc: options?.bcc?.map((addr) =>
        addr.name ? `${addr.name} <${addr.address}>` : addr.address
      ),
      replyTo: options?.replyTo
        ? options.replyTo.name
          ? `${options.replyTo.name} <${options.replyTo.address}>`
          : options.replyTo.address
        : undefined,
      inReplyTo: options?.inReplyTo,
      references: options?.references,
      attachments: options?.attachments?.map((att) => ({
        filename: att.filename,
        contentType: att.contentType,
        content: att.content,
        cid: att.contentId,
      })),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      this.logger.log(`Email sent: ${info.messageId}`);
      return info.messageId;
    } catch (error) {
      this.logger.error('Error sending email:', error);
      throw error;
    }
  }

  /**
   * Verify SMTP connection
   */
  async verifyConnection(account: EmailAccount): Promise<boolean> {
    try {
      const transporter = await this.createTransporter(account);
      await transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP verification failed:', error);
      return false;
    }
  }

  /**
   * Get default SMTP host for provider
   */
  private getDefaultSmtpHost(provider: string): string {
    switch (provider) {
      case 'gmail':
        return 'smtp.gmail.com';
      case 'outlook':
        return 'smtp.office365.com';
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get default SMTP port for provider
   */
  private getDefaultSmtpPort(provider: string): number {
    switch (provider) {
      case 'gmail':
        return 465;
      case 'outlook':
        return 587;
      default:
        return 587;
    }
  }

  /**
   * Decrypt credentials
   */
  private decryptCredentials(encrypted: string): string {
    // TODO: Inject EncryptionService when available
    // For now, return as-is (will be implemented with proper encryption service)
    try {
      // If it's not encrypted (legacy), return as-is
      if (!encrypted.includes('=') || encrypted.length < 100) {
        return encrypted;
      }
      // Otherwise, decrypt (placeholder - will use EncryptionService)
      return encrypted;
    } catch {
      return encrypted;
    }
  }
}
