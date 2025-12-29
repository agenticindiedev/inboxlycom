export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  content: Buffer;
  contentId?: string;
}

export interface Email {
  id: string;
  messageId: string;
  threadId: string;
  accountId: string;
  folder: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: {
    text?: string;
    html?: string;
  };
  attachments: Attachment[];
  flags: string[];
  date: Date;
  receivedDate: Date;
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: number;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailThread {
  id: string;
  accountId: string;
  subject: string;
  emails: Email[];
  unreadCount: number;
  lastEmailDate: Date;
  aiSummary?: string;
}
