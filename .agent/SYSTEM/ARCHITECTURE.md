# Architecture - AI Email Client

**Purpose:** Document what IS implemented (not what WILL BE).
**Last Updated:** 2025-12-29

---

## Overview

AI-powered email client with multi-account support. Users can connect Gmail via OAuth or any IMAP server with credentials. Features include email sync, threaded conversations, compose/reply, and AI-powered summaries.

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, Zustand
- **Backend:** NestJS 11, MongoDB (Mongoose), Redis (caching)
- **UI:** @agenticindiedev/ui (dark theme preset)
- **Build:** Bun, Biome (linting/formatting)

---

## Project Structure

```
apps/
├── web/                      # Next.js frontend
│   ├── app/
│   │   ├── (app)/
│   │   │   ├── inbox/       # Email inbox page
│   │   │   └── settings/    # Account settings page
│   │   ├── layout.tsx       # Root layout with theme
│   │   └── globals.css      # CSS variables for theming
│   ├── components/
│   │   ├── folder-navigation.tsx  # Sidebar with folders + settings
│   │   ├── inbox-list.tsx         # Email thread list
│   │   ├── email-reader.tsx       # Email detail view
│   │   └── compose-window.tsx     # Email composition modal
│   └── lib/
│       ├── api.ts                 # API client (emailsApi, accountsApi)
│       └── stores/
│           ├── email-store.ts     # Zustand store for emails
│           └── account-store.ts   # Zustand store for accounts
├── api/                      # NestJS backend
│   └── src/
│       ├── account/          # Account management module
│       │   ├── account.module.ts
│       │   ├── account.service.ts
│       │   └── account.controller.ts
│       ├── auth/             # Authentication module
│       │   └── services/
│       │       └── encryption.service.ts
│       ├── email/            # Email operations module
│       │   ├── schemas/
│       │   │   ├── email.schema.ts
│       │   │   └── account.schema.ts
│       │   └── services/
│       │       ├── email.service.ts
│       │       ├── imap.service.ts
│       │       ├── smtp.service.ts
│       │       └── sync.service.ts
│       ├── ai/               # AI summarization module
│       └── sync/             # WebSocket sync module
└── packages/
    └── shared/               # Shared types and utilities
```

---

## Key Components

### Account Module

**Purpose:** Manage email account connections (Google OAuth, IMAP)
**Location:** `apps/api/src/account/`
**Dependencies:** EncryptionService, ImapService, Mongoose

Endpoints:
- `GET /accounts` - List connected accounts
- `POST /accounts/imap` - Add IMAP account
- `DELETE /accounts/:id` - Remove account
- `GET /accounts/:id/test` - Test connection
- `GET /accounts/google/auth-url` - Get OAuth URL
- `POST /accounts/google/callback` - Complete OAuth

### Email Module

**Purpose:** Sync, store, and retrieve emails
**Location:** `apps/api/src/email/`
**Dependencies:** ImapService, SmtpService, CacheService, Mongoose

Endpoints:
- `GET /emails/accounts/:id` - Get emails for account
- `GET /emails/accounts/:id/threads` - Get email threads
- `GET /emails/accounts/:id/sync` - Trigger sync
- `POST /emails/accounts/:id/send` - Send email

### Settings Page

**Purpose:** UI for connecting email accounts
**Location:** `apps/web/app/(app)/settings/page.tsx`
**Features:**
- List connected accounts with test/delete
- Connect Google button (OAuth redirect)
- Add IMAP Server modal (form with encryption)

---

## Data Flow

```
[Google OAuth]                    [IMAP Form]
      ↓                                ↓
   Redirect                      POST /accounts/imap
      ↓                                ↓
Google consent screen          Encrypt password
      ↓                                ↓
Callback with code             Store in MongoDB
      ↓                                ↓
Exchange for tokens                    ↓
      ↓                                ↓
Store encrypted refresh token ←--------┘
      ↓
[Account created]
      ↓
User triggers sync → ImapService.connect()
      ↓
Fetch emails → Store in MongoDB
      ↓
Frontend fetches via API → Display in UI
```

---

## External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Google OAuth | Gmail account connection | https://developers.google.com/identity/protocols/oauth2 |
| MongoDB | Data persistence | https://www.mongodb.com/docs/ |
| Redis | Email caching | https://redis.io/docs/ |

---

## Configuration

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | MongoDB connection string | Yes |
| `REDIS_URL` | Redis connection string | For caching |
| `ENCRYPTION_KEY` | 32+ char key for credential encryption | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | For Gmail |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | For Gmail |
| `GOOGLE_REDIRECT_URI` | OAuth callback URL | For Gmail |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend | Yes |

---

## Deployment

- **Frontend:** Vercel or any Node.js host
- **Backend:** Docker container or Node.js server
- **Database:** MongoDB Atlas or self-hosted
- **Cache:** Redis Cloud or self-hosted

---

## Security

- **Credential encryption:** AES-256-GCM via EncryptionService
- **OAuth tokens:** Refresh tokens encrypted at rest
- **IMAP passwords:** Encrypted before storage
- **API:** CORS configured for frontend origin

See `quality/SECURITY-CHECKLIST.md` for full security considerations.

---

## Related Documentation

- `RULES.md` - Coding standards
- `architecture/DECISIONS.md` - Architectural decisions
- `architecture/PROJECT-MAP.md` - Project map
