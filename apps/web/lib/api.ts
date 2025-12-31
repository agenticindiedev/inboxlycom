const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export interface Email {
  id: string;
  messageId: string;
  threadId: string;
  accountId: string;
  folder: string;
  from: { name?: string; address: string };
  to: Array<{ name?: string; address: string }>;
  cc?: Array<{ name?: string; address: string }>;
  bcc?: Array<{ name?: string; address: string }>;
  subject: string;
  body: { text?: string; html?: string };
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
    contentId?: string;
  }>;
  flags: string[];
  date: string;
  receivedDate: string;
  aiSummary?: string;
  aiCategory?: string;
  aiPriority?: number;
  syncedAt: string;
}

export interface EmailThread {
  id: string;
  accountId: string;
  subject: string;
  emails: Email[];
  unreadCount: number;
  lastEmailDate: string;
  aiSummary?: string;
}

export interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  lastSyncAt?: string;
  isConnected: boolean;
}

export interface CreateImapAccountData {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

export const accountsApi = {
  getAccounts: (): Promise<EmailAccount[]> => {
    return apiRequest('/accounts');
  },

  getAccount: (accountId: string): Promise<EmailAccount> => {
    return apiRequest(`/accounts/${accountId}`);
  },

  createImapAccount: (data: CreateImapAccountData): Promise<EmailAccount> => {
    return apiRequest('/accounts/imap', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteAccount: (accountId: string): Promise<void> => {
    return apiRequest(`/accounts/${accountId}`, {
      method: 'DELETE',
    });
  },

  getGoogleAuthUrl: (): Promise<{ url: string }> => {
    return apiRequest('/accounts/google/auth-url');
  },

  connectGoogle: (code: string): Promise<EmailAccount> => {
    return apiRequest('/accounts/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  testConnection: (accountId: string): Promise<{ success: boolean; error?: string }> => {
    return apiRequest(`/accounts/${accountId}/test`);
  },
};

export const emailsApi = {
  syncAccount: (accountId: string): Promise<{ synced: number }> => {
    return apiRequest(`/emails/accounts/${accountId}/sync`);
  },

  getEmails: (accountId: string, folder = 'INBOX', limit = 50, offset = 0): Promise<Email[]> => {
    const params = new URLSearchParams({
      folder,
      limit: limit.toString(),
      offset: offset.toString(),
    });
    return apiRequest(`/emails/accounts/${accountId}?${params.toString()}`);
  },

  getThreads: (accountId: string, limit = 50): Promise<EmailThread[]> => {
    return apiRequest(`/emails/accounts/${accountId}/threads?limit=${limit}`);
  },

  getEmail: (emailId: string): Promise<Email> => {
    return apiRequest(`/emails/${emailId}`);
  },

  sendEmail: (
    accountId: string,
    data: {
      to: Array<{ name?: string; address: string }>;
      subject: string;
      body: { text?: string; html?: string };
      cc?: Array<{ name?: string; address: string }>;
      bcc?: Array<{ name?: string; address: string }>;
      replyTo?: { name?: string; address: string };
      attachments?: Array<{
        filename: string;
        contentType: string;
        size: number;
        contentId?: string;
      }>;
      inReplyTo?: string;
      references?: string[];
    }
  ): Promise<{ messageId: string }> => {
    return apiRequest(`/emails/accounts/${accountId}/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const aiApi = {
  summarizeEmail: (text: string, html?: string): Promise<{ summary: string }> => {
    return apiRequest('/ai/summarize/email', {
      method: 'POST',
      body: JSON.stringify({ text, html }),
    });
  },

  summarizeThread: (emails: Array<{
    subject: string;
    body: string;
    from: string;
    date: string;
  }>): Promise<{ summary: string }> => {
    return apiRequest('/ai/summarize/thread', {
      method: 'POST',
      body: JSON.stringify({ emails }),
    });
  },

  generateDraft: (
    subject: string,
    recipient: string,
    context?: string,
    tone?: 'professional' | 'casual' | 'friendly'
  ): Promise<{ draft: string }> => {
    return apiRequest('/ai/compose/generate', {
      method: 'POST',
      body: JSON.stringify({ subject, recipient, context, tone }),
    });
  },

  generateReply: (
    originalEmail: {
      subject: string;
      body: string;
      from: string;
    },
    context?: string,
    tone?: 'professional' | 'casual' | 'friendly'
  ): Promise<{ reply: string }> => {
    return apiRequest('/ai/auto-reply/generate', {
      method: 'POST',
      body: JSON.stringify({ originalEmail, context, tone }),
    });
  },

  chat: (message: string, threadContext?: EmailThread): Promise<{ response: string }> => {
    // This is a generic chat endpoint - you may need to create this in the backend
    return apiRequest('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, threadContext }),
    });
  },
};
