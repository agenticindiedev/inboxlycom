# AI Email Client Architecture

## System Overview

The AI-native email client is built as a web-first application with a monorepo structure, separating concerns between frontend, backend, and shared packages.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Email UI   │  │   AI UI      │  │   State Mgmt  │     │
│  │  Components  │  │  Components  │  │   (Zustand)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘             │
│                           │                                 │
│                    ┌──────▼──────┐                         │
│                    │  API Client │                         │
│                    │  WebSocket  │                         │
│                    └──────┬──────┘                         │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────▼─────────────────────────────────┐
│                   Backend (NestJS)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  REST API    │  │  WebSocket   │  │   AI Service │    │
│  │  Controllers │  │   Gateway    │  │              │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                 │            │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌─────▼───────┐   │
│  │ Email Service│  │  Sync Service│  │ AI Providers│   │
│  └──────┬───────┘  └──────┬───────┘  └─────┬───────┘   │
│         │                 │                 │            │
│  ┌──────▼───────┐  ┌──────▼───────┐       │            │
│  │ IMAP Client  │  │ SMTP Client  │       │            │
│  └──────┬───────┘  └──────┬───────┘       │            │
│         │                 │                 │            │
│         └─────────────────┼─────────────────┘            │
│                           │                              │
│                    ┌──────▼──────┐                       │
│                    │   Cache     │                       │
│                    │   (Redis)   │                       │
│                    └──────┬──────┘                       │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                      Storage Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   MongoDB    │  │    Redis     │  │  Keychain    │  │
│  │  (Metadata)  │  │   (Cache)    │  │ (Credentials)│  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────┐
│                  External Services                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Email Servers│  │  AI APIs     │  │  OAuth2      │  │
│  │ Gmail/Outlook│  │ OpenAI/Claude│  │  Providers   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (Next.js)

#### Core Components
- **InboxView**: Main inbox list with email threads
- **EmailReader**: Individual email display with HTML rendering
- **ComposeWindow**: Email composition with AI assistance
- **FolderNavigation**: Sidebar with folders/labels
- **SearchBar**: Full-text search interface

#### AI Components
- **SmartCompose**: Real-time AI suggestions while typing
- **EmailSummary**: Thread and email summarization display
- **SmartCategories**: AI-categorized folders view
- **AutoReply**: Auto-reply generation and approval

#### State Management
- **EmailStore** (Zustand): Email list, selected email, folders
- **AIStore** (Zustand): AI suggestions, summaries, categories
- **SyncStore** (Zustand): Sync status, offline queue

### Backend (NestJS)

#### Modules

1. **EmailModule**
   - `EmailService`: Core email operations
   - `ImapService`: IMAP protocol handling
   - `SmtpService`: SMTP sending
   - `EmailController`: REST endpoints

2. **SyncModule**
   - `SyncService`: Email synchronization logic
   - `SyncGateway`: WebSocket for real-time updates
   - Background jobs for periodic sync

3. **AIModule**
   - `AIService`: AI feature orchestration
   - `ComposeService`: Smart compose generation
   - `SummarizationService`: Email summarization
   - `CategorizationService`: Email categorization
   - `AutoReplyService`: Auto-reply generation

4. **AuthModule**
   - OAuth2 handling for Gmail/Outlook
   - Credential encryption/decryption
   - Session management

5. **StorageModule**
   - MongoDB schemas and services
   - Redis caching layer
   - Search indexing

### Data Models

#### Email
```typescript
{
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
}
```

#### Account
```typescript
{
  id: string;
  userId: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  encryptedCredentials: string;
  oauth2Tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  };
  imapConfig?: {
    host: string;
    port: number;
    secure: boolean;
  };
  smtpConfig?: {
    host: string;
    port: number;
    secure: boolean;
  };
  lastSyncAt?: Date;
}
```

## Data Flow

### Email Fetching Flow
1. User opens inbox → Frontend requests emails
2. Backend checks Redis cache
3. If cache miss, IMAP service fetches from email server
4. Emails parsed with mailparser
5. Stored in MongoDB, cached in Redis
6. Returned to frontend via REST API
7. WebSocket notifies other clients of new emails

### AI Feature Flow
1. User triggers AI feature (compose, summarize, etc.)
2. Frontend sends request to AI service
3. Backend checks Redis cache for AI results
4. If cache miss, calls AI provider (OpenAI/Anthropic)
5. Result cached and returned
6. Frontend displays AI-generated content

### Sync Flow
1. Background job runs periodically (every 5 minutes)
2. For each account, IMAP service checks for new emails
3. New emails fetched and processed
4. WebSocket broadcasts updates to connected clients
5. Frontend updates UI in real-time

## Security Considerations

1. **Credential Storage**: Encrypted in MongoDB using AES-256
2. **OAuth2 Tokens**: Encrypted, auto-refreshed
3. **API Keys**: Environment variables, never in code
4. **Data Encryption**: End-to-end encryption for sensitive emails
5. **HTTPS Only**: All communications over TLS
6. **Rate Limiting**: Prevent abuse of AI APIs

## Performance Optimizations

1. **Caching**: Redis for email metadata and AI results
2. **Pagination**: Fetch emails in batches (50 per page)
3. **Lazy Loading**: Load email body only when opened
4. **Indexing**: MongoDB indexes on threadId, accountId, date
5. **WebSocket**: Real-time updates without polling
6. **Background Jobs**: Async processing for heavy operations

## AI Integration Points

1. **Smart Compose**: Real-time suggestions as user types
2. **Summarization**: On-demand or automatic for long threads
3. **Categorization**: Automatic classification on email receive
4. **Auto-Reply**: Draft generation with user approval
5. **Priority Detection**: AI-assigned priority scores

## Deployment Architecture

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway/Render (NestJS)
- **Database**: MongoDB Atlas
- **Cache**: Upstash Redis
- **Queue**: BullMQ (Redis-based)
- **CDN**: Vercel Edge Network

