import { Injectable, Logger } from '@nestjs/common';
import * as Imap from 'imap';
import { simpleParser } from 'mailparser';
import { EmailAccount } from '../schemas/account.schema';
import { Email } from '../schemas/email.schema';

@Injectable()
export class ImapService {
  private readonly logger = new Logger(ImapService.name);

  /**
   * Connect to IMAP server and return connection
   */
  async connect(account: EmailAccount): Promise<Imap> {
    return new Promise((resolve, reject) => {
      const config: Imap.Config = {
        user: account.email,
        password: this.decryptCredentials(account.encryptedCredentials),
        host: account.imapConfig?.host || this.getDefaultImapHost(account.provider),
        port: account.imapConfig?.port || this.getDefaultImapPort(account.provider),
        tls: account.imapConfig?.secure ?? true,
        tlsOptions: { rejectUnauthorized: false },
      };

      // If OAuth2, use access token
      if (account.oauth2Tokens && account.provider === 'gmail') {
        config.xoauth2 = account.oauth2Tokens.accessToken;
      }

      const imap = new Imap(config);

      imap.once('ready', () => {
        this.logger.log(`Connected to IMAP for ${account.email}`);
        resolve(imap);
      });

      imap.once('error', (err: Error) => {
        this.logger.error(`IMAP connection error for ${account.email}:`, err);
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * List all folders/mailboxes
   */
  async listFolders(imap: Imap): Promise<string[]> {
    return new Promise((resolve, reject) => {
      imap.getBoxes((err, boxes) => {
        if (err) {
          reject(err);
          return;
        }

        const folders: string[] = [];
        const traverse = (name: string, box: Imap.Folder, prefix = '') => {
          folders.push(prefix + name);
          if (box.children) {
            Object.entries(box.children).forEach(([childName, childBox]) => {
              traverse(childName, childBox, prefix + name + box.delimiter);
            });
          }
        };

        Object.entries(boxes).forEach(([name, box]) => traverse(name, box));
        resolve(folders);
      });
    });
  }

  /**
   * Fetch emails from a folder
   */
  async fetchEmails(imap: Imap, folder: string, limit = 50, since?: Date): Promise<Email[]> {
    return new Promise((resolve, reject) => {
      imap.openBox(folder, true, (err, _box) => {
        if (err) {
          reject(err);
          return;
        }

        const searchCriteria: any[] = ['ALL'];
        if (since) {
          searchCriteria.push(['SINCE', since]);
        }

        imap.search(searchCriteria, (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            resolve([]);
            return;
          }

          // Get the most recent emails
          const uids = results.slice(-limit).reverse();
          const fetch = imap.fetch(uids, {
            bodies: '',
            struct: true,
          });

          const emails: Email[] = [];
          let emailCount = 0;

          fetch.on('message', (msg, _seqno) => {
            let emailBuffer = Buffer.alloc(0);

            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                emailBuffer = Buffer.concat([emailBuffer, chunk]);
              });
            });

            msg.once('end', async () => {
              try {
                const parsed = await simpleParser(emailBuffer);
                const email = this.parseEmail(parsed, folder);
                emails.push(email);
                emailCount++;

                if (emailCount === uids.length) {
                  resolve(emails);
                }
              } catch (parseErr) {
                this.logger.error('Error parsing email:', parseErr);
                emailCount++;
                if (emailCount === uids.length) {
                  resolve(emails);
                }
              }
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });
        });
      });
    });
  }

  /**
   * Parse mailparser result to Email schema
   */
  private parseEmail(parsed: any, folder: string): Email {
    return {
      messageId: parsed.messageId || `msg-${Date.now()}-${Math.random()}`,
      threadId: parsed.inReplyTo || parsed.messageId || `thread-${Date.now()}`,
      accountId: '', // Will be set by caller
      folder,
      from: {
        name: parsed.from?.text || parsed.from?.name,
        address: parsed.from?.value?.[0]?.address || parsed.from?.address || '',
      },
      to: (parsed.to?.value || parsed.to || []).map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      cc: parsed.cc?.value?.map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      bcc: parsed.bcc?.value?.map((addr: any) => ({
        name: addr.name,
        address: addr.address,
      })),
      subject: parsed.subject || '(No Subject)',
      body: {
        text: parsed.text,
        html: parsed.html,
      },
      attachments: (parsed.attachments || []).map((att: any) => ({
        filename: att.filename,
        contentType: att.contentType,
        size: att.size,
        contentId: att.contentId,
      })),
      flags: parsed.flags || [],
      date: parsed.date || new Date(),
      receivedDate: parsed.date || new Date(),
      syncedAt: new Date(),
    } as Email;
  }

  /**
   * Get default IMAP host for provider
   */
  private getDefaultImapHost(provider: string): string {
    switch (provider) {
      case 'gmail':
        return 'imap.gmail.com';
      case 'outlook':
        return 'outlook.office365.com';
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Get default IMAP port for provider
   */
  private getDefaultImapPort(provider: string): number {
    switch (provider) {
      case 'gmail':
        return 993;
      case 'outlook':
        return 993;
      default:
        return 993;
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
