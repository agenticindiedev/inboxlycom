import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EncryptionService } from '../auth/services/encryption.service';
import { EmailAccount, EmailAccountDocument } from '../email/schemas/account.schema';
import { ImapService } from '../email/services/imap.service';

export interface CreateImapAccountDto {
  userId: string;
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

export interface AccountResponse {
  id: string;
  provider: string;
  email: string;
  lastSyncAt?: Date;
  isConnected: boolean;
}

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectModel(EmailAccount.name) private accountModel: Model<EmailAccountDocument>,
    private encryptionService: EncryptionService,
    private imapService: ImapService
  ) {}

  /**
   * Get all accounts for a user
   */
  async getAccounts(userId: string): Promise<AccountResponse[]> {
    const accounts = await this.accountModel.find({ userId }).exec();
    return accounts.map((account) => this.toAccountResponse(account));
  }

  /**
   * Get a single account by ID
   */
  async getAccount(accountId: string): Promise<AccountResponse> {
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    return this.toAccountResponse(account);
  }

  /**
   * Create an IMAP/SMTP account
   */
  async createImapAccount(data: CreateImapAccountDto): Promise<AccountResponse> {
    // Encrypt the password
    const encryptedPassword = this.encryptionService.encrypt(data.password);

    const account = new this.accountModel({
      userId: data.userId,
      provider: 'imap',
      email: data.email,
      encryptedCredentials: encryptedPassword,
      imapConfig: {
        host: data.imapHost,
        port: data.imapPort,
        secure: data.imapSecure,
      },
      smtpConfig: {
        host: data.smtpHost,
        port: data.smtpPort,
        secure: data.smtpSecure,
      },
    });

    await account.save();
    this.logger.log(`Created IMAP account for ${data.email}`);

    return this.toAccountResponse(account);
  }

  /**
   * Delete an account
   */
  async deleteAccount(accountId: string): Promise<void> {
    const result = await this.accountModel.findByIdAndDelete(accountId).exec();
    if (!result) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }
    this.logger.log(`Deleted account ${accountId}`);
  }

  /**
   * Test account connection
   */
  async testConnection(accountId: string): Promise<{ success: boolean; error?: string }> {
    const account = await this.accountModel.findById(accountId).exec();
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    try {
      const imap = await this.imapService.connect(account);
      imap.end();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection test failed for ${account.email}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get Google OAuth URL (placeholder - needs Google OAuth setup)
   */
  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID not configured');
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', scopes.join(' '));
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');

    return url.toString();
  }

  /**
   * Handle Google OAuth callback
   */
  async connectGoogle(userId: string, code: string): Promise<AccountResponse> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get user email from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info from Google');
    }

    const userInfo = await userInfoResponse.json();

    // Check if account already exists
    const existing = await this.accountModel.findOne({ email: userInfo.email }).exec();
    if (existing) {
      // Update tokens
      existing.oauth2Tokens = {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      };
      await existing.save();
      return this.toAccountResponse(existing);
    }

    // Create new account
    const account = new this.accountModel({
      userId,
      provider: 'gmail',
      email: userInfo.email,
      encryptedCredentials: this.encryptionService.encrypt(tokens.refresh_token),
      oauth2Tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      },
    });

    await account.save();
    this.logger.log(`Connected Google account for ${userInfo.email}`);

    return this.toAccountResponse(account);
  }

  /**
   * Convert account document to response DTO
   */
  private toAccountResponse(account: EmailAccountDocument): AccountResponse {
    return {
      id: account._id.toString(),
      provider: account.provider,
      email: account.email,
      lastSyncAt: account.lastSyncAt,
      isConnected: true,
    };
  }
}
