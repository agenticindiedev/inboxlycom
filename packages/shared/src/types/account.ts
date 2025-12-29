export type EmailProvider = 'gmail' | 'outlook' | 'imap';

export interface OAuth2Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

export interface EmailAccount {
  id: string;
  userId: string;
  provider: EmailProvider;
  email: string;
  encryptedCredentials: string;
  oauth2Tokens?: OAuth2Tokens;
  imapConfig?: ImapConfig;
  smtpConfig?: SmtpConfig;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
