# AI-Native Email Client

![Status](https://img.shields.io/badge/status-WIP-yellow)
![Version](https://img.shields.io/badge/version-beta-orange)
![Not Production Ready](https://img.shields.io/badge/production-not%20ready-red)

> ⚠️ **Warning**: This project is currently under active development and is **not ready for production use**. Many features are incomplete, and the codebase is subject to significant changes.

An open-source, AI-powered email client built with Next.js, NestJS, and TypeScript. Replace Spark with a modern, AI-enhanced email experience.

## Features

- 📧 **Full Email Support**: IMAP/SMTP with OAuth2 (Gmail, Outlook)
- 🤖 **AI-Powered**: Smart compose, summarization, categorization, auto-reply
- ⚡ **Real-time Sync**: WebSocket-based live updates
- 🔒 **Secure**: Encrypted credentials, end-to-end encryption
- 🌐 **Web-First**: PWA support, works everywhere
- 📱 **Responsive**: Beautiful UI built with Tailwind CSS

## Tech Stack

- **Frontend**: Next.js 16+, React 19, TypeScript, Tailwind CSS
- **Backend**: NestJS 11+, MongoDB, Redis, BullMQ
- **Email**: imap, nodemailer, mailparser
- **AI**: OpenRouter (unified access to multiple AI models)
- **Auth**: OAuth2 (Gmail, Outlook)

## Getting Started

### Prerequisites

- Bun runtime
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- OAuth2 credentials (Gmail, Outlook)

### Installation

```bash
cd apps/ai-email-client
bun install
```

### Environment Variables

**apps/api/.env:**
```env
DATABASE_URL=mongodb://localhost:27017/ai-email
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
PORT=4000

# OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# AI API (OpenRouter - unified access to multiple models)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet  # Optional: defaults to claude-3.5-sonnet
OPENROUTER_HTTP_REFERER=https://github.com/your-repo  # Optional: for tracking
OPENROUTER_APP_NAME=AI Email Client  # Optional: app name for tracking
```

**apps/web/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### Running

```bash
# Run all apps
bun run dev

# Or individually
bun run dev:api   # Backend on http://localhost:4000
bun run dev:web   # Frontend on http://localhost:3000
```

## Project Structure

```
ai-email-client/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   ├── shared/       # Shared types and utilities
│   └── ui/           # Shared UI components (if needed)
└── package.json      # Monorepo root
```

## Documentation

- [Architecture](ARCHITECTURE.md) - System architecture and design
- [Research](RESEARCH.md) - Email library research and recommendations

## License

MIT

