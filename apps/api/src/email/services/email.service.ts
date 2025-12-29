import { Attachment, EmailAddress } from '@ai-email/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailAccount, EmailAccountDocument } from '../schemas/account.schema';
import { Email, EmailDocument } from '../schemas/email.schema';
import { CacheService } from './cache.service';
import { ImapService } from './imap.service';
import { SmtpService } from './smtp.service';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @InjectModel(Email.name) public emailModel: Model<EmailDocument>,
    @InjectModel(EmailAccount.name) private accountModel: Model<EmailAccountDocument>,
    private imapService: ImapService,
    private smtpService: SmtpService,
    private cacheService: CacheService
  ) {}

  /**
   * Sync emails for an account
   */
  async syncAccount(accountId: string, syncGateway?: any): Promise<number> {
    const account = await this.accountModel.findById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    this.logger.log(`Syncing account: ${account.email}`);

    const imap = await this.imapService.connect(account);
    let syncedCount = 0;

    try {
      const folders = await this.imapService.listFolders(imap);
      const inboxFolder = folders.find((f) => f.toLowerCase().includes('inbox')) || folders[0];

      // Get last sync time
      const lastSync = account.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days ago

      // Fetch emails since last sync
      const emails = await this.imapService.fetchEmails(imap, inboxFolder, 100, lastSync);

      // Save emails to database
      for (const email of emails) {
        email.accountId = accountId;
        email.folder = inboxFolder;

        // Check if email already exists
        const existing = await this.emailModel.findOne({ messageId: email.messageId });
        if (!existing) {
          await this.emailModel.create(email);
          syncedCount++;

          // Broadcast new email via WebSocket
          if (syncGateway) {
            syncGateway.broadcastNewEmail(accountId, email);
          }
        }
      }

      // Update last sync time
      account.lastSyncAt = new Date();
      await account.save();

      // Broadcast sync status
      if (syncGateway) {
        syncGateway.broadcastSyncStatus(accountId, {
          lastSyncAt: account.lastSyncAt,
          syncing: false,
        });
      }

      this.logger.log(`Synced ${syncedCount} new emails for ${account.email}`);
    } finally {
      imap.end();
    }

    return syncedCount;
  }

  /**
   * Get emails for an account (with caching)
   */
  async getEmails(accountId: string, folder = 'INBOX', limit = 50, offset = 0): Promise<Email[]> {
    // Check cache first
    const cached = await this.cacheService.getCachedEmailList(accountId, folder, offset);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const emails = await this.emailModel
      .find({ accountId, folder })
      .sort({ date: -1 })
      .limit(limit)
      .skip(offset)
      .exec();

    // Cache the result
    await this.cacheService.cacheEmailList(accountId, folder, emails, offset);

    return emails;
  }

  /**
   * Get email by ID
   */
  async getEmailById(emailId: string): Promise<Email | null> {
    return this.emailModel.findById(emailId).exec();
  }

  /**
   * Send email
   */
  async sendEmail(
    accountId: string,
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
    const account = await this.accountModel.findById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    return this.smtpService.sendEmail(account, to, subject, body, options);
  }

  /**
   * Get email threads (with caching)
   */
  async getThreads(accountId: string, limit = 50): Promise<any[]> {
    // Check cache first
    const cached = await this.cacheService.getCachedThreads(accountId);
    if (cached) {
      return cached.slice(0, limit);
    }

    const emails = await this.emailModel
      .find({ accountId })
      .sort({ date: -1 })
      .limit(limit * 10) // Get more emails to group into threads
      .exec();

    // Group by threadId
    const threadMap = new Map<string, Email[]>();
    emails.forEach((email) => {
      const threadId = email.threadId;
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(email);
    });

    // Convert to thread objects
    const threads = Array.from(threadMap.entries())
      .map(([threadId, threadEmails]) => ({
        id: threadId,
        accountId,
        subject: threadEmails[0]?.subject || '(No Subject)',
        emails: threadEmails.sort((a, b) => a.date.getTime() - b.date.getTime()),
        unreadCount: threadEmails.filter((e) => !e.flags.includes('\\Seen')).length,
        lastEmailDate: threadEmails[threadEmails.length - 1]?.date || new Date(),
      }))
      .sort((a, b) => b.lastEmailDate.getTime() - a.lastEmailDate.getTime())
      .slice(0, limit);

    // Cache the result
    await this.cacheService.cacheThreads(accountId, threads);

    return threads;
  }
}
