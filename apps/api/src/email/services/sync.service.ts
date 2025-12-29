import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailAccount, EmailAccountDocument } from '../schemas/account.schema';
import { Email } from '../schemas/email.schema';
import { CacheService } from './cache.service';
import { EmailService } from './email.service';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private syncInProgress = new Map<string, boolean>();
  private syncGateway?: any;

  constructor(
    @InjectModel(EmailAccount.name)
    private accountModel: Model<EmailAccountDocument>,
    private emailService: EmailService,
    private cacheService: CacheService
  ) {}

  /**
   * Set the sync gateway for broadcasting updates
   */
  setSyncGateway(gateway: any): void {
    this.syncGateway = gateway;
  }

  /**
   * Sync all accounts
   */
  async syncAllAccounts(): Promise<void> {
    const accounts = await this.accountModel.find().exec();
    for (const account of accounts) {
      try {
        await this.syncAccount(String(account._id));
      } catch (error) {
        this.logger.error(`Failed to sync account ${String(account._id)}:`, error);
      }
    }
  }



  /**
   * Sync single account with conflict resolution
   */
  async syncAccount(accountId: string): Promise<number> {
    // Prevent concurrent syncs for same account
    if (this.syncInProgress.get(accountId)) {
      this.logger.warn(`Sync already in progress for account ${accountId}`);
      return 0;
    }

    this.syncInProgress.set(accountId, true);

    // Broadcast sync start
    if (this.syncGateway) {
      this.syncGateway.broadcastSyncStatus(accountId, {
        syncing: true,
      });
    }

    try {
      const syncedCount = await this.emailService.syncAccount(accountId, this.syncGateway);

      // Invalidate cache after sync
      await this.cacheService.invalidateAccountCache(accountId);

      return syncedCount;
    } finally {
      this.syncInProgress.set(accountId, false);

      // Broadcast sync complete
      if (this.syncGateway) {
        const status = await this.getSyncStatus(accountId);
        this.syncGateway.broadcastSyncStatus(accountId, status);
      }
    }
  }

  /**
   * Resolve conflicts between local and remote emails
   */
  async resolveConflicts(accountId: string): Promise<number> {
    // Get all emails for account
    const emails = await this.emailService.getEmails(accountId, 'INBOX', 1000, 0);

    // Group by messageId to find duplicates
    const emailMap = new Map<string, Email[]>();
    emails.forEach((email) => {
      if (!emailMap.has(email.messageId)) {
        emailMap.set(email.messageId, []);
      }
      emailMap.get(email.messageId)!.push(email);
    });

    let resolvedCount = 0;

    // Resolve duplicates - keep the most recent one
    for (const [_messageId, duplicates] of emailMap.entries()) {
      if (duplicates.length > 1) {
        // Sort by syncedAt, keep the most recent
        duplicates.sort((a, b) => b.syncedAt.getTime() - a.syncedAt.getTime());
        const _keep = duplicates[0];
        const remove = duplicates.slice(1);



        // Remove duplicates
        for (const email of remove) {
          await this.emailService.emailModel.findByIdAndDelete((email as any)._id);
          resolvedCount++;
        }
      }
    }

    return resolvedCount;
  }

  /**
   * Get sync status for account
   */
  async getSyncStatus(accountId: string): Promise<{
    lastSyncAt: Date | null;
    syncing: boolean;
    emailCount: number;
  }> {
    const account = await this.accountModel.findById(accountId);
    if (!account) {
      throw new Error(`Account ${accountId} not found`);
    }

    const emailCount = await this.emailService.emailModel.countDocuments({ accountId }).exec();

    return {
      lastSyncAt: account.lastSyncAt || null,
      syncing: this.syncInProgress.get(accountId),
      emailCount,
    };
  }
}
