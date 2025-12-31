# Email Sync Guide

## Overview

**You don't need to manage IMAP directly!** The system already handles all IMAP protocol communication. Here's how to get all your emails:

## How It Works

1. **IMAP is Already Implemented** - The `ImapService` handles all IMAP connections
2. **Sync Service** - Automatically fetches emails from your email provider
3. **Database Storage** - Emails are stored in MongoDB for fast access
4. **Real-time Updates** - WebSocket support for live email notifications

## Getting Your Emails

### Step 1: Connect Your Email Account

You have three options:

#### Option A: Gmail (OAuth2 - Recommended)
```typescript
// Frontend: Get OAuth URL
const { url } = await accountsApi.getGoogleAuthUrl();
// Redirect user to url, then:
const account = await accountsApi.connectGoogle(code);
```

#### Option B: Outlook (OAuth2 - Recommended)
```typescript
// Similar to Gmail, use Microsoft OAuth flow
```

#### Option C: IMAP/SMTP (Manual)
```typescript
// For any email provider
const account = await accountsApi.createImapAccount({
  email: 'your@email.com',
  password: 'your-password',
  imapHost: 'imap.gmail.com',
  imapPort: 993,
  imapSecure: true,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: true,
});
```

### Step 2: Sync Emails

Once your account is connected, sync emails:

```typescript
// Sync a specific account
const result = await emailsApi.syncAccount(accountId);
// Returns: { synced: 5 } // number of new emails

// Or use the sync endpoint directly
await fetch(`/api/emails/accounts/${accountId}/sync`);
```

### Step 3: Retrieve Emails

After syncing, emails are stored in MongoDB. Retrieve them:

```typescript
// Get emails (from database, not IMAP)
const emails = await emailsApi.getEmails(accountId, 'INBOX', 50, 0);

// Get threads (grouped conversations)
const threads = await emailsApi.getThreads(accountId, 50);

// Get single email
const email = await emailsApi.getEmail(emailId);
```

## How Sync Works Internally

The sync process (handled automatically):

1. **Connects to IMAP** - Uses `ImapService.connect()` with your account credentials
2. **Lists Folders** - Finds your INBOX folder
3. **Fetches Emails** - Gets emails since last sync (or last 7 days on first sync)
4. **Parses Emails** - Uses `mailparser` to extract content, attachments, etc.
5. **Stores in Database** - Saves to MongoDB (skips duplicates by `messageId`)
6. **Updates Sync Time** - Records when sync completed
7. **Broadcasts Updates** - Sends WebSocket notifications if enabled

## API Endpoints

### Sync Endpoints

```bash
# Sync specific account
GET /api/emails/accounts/:accountId/sync
# Returns: { synced: 10 }

# Or use the sync controller
POST /api/sync/accounts/:accountId
GET /api/sync/accounts/:accountId/status
POST /api/sync/all  # Sync all accounts
```

### Email Endpoints

```bash
# Get emails (from database)
GET /api/emails/accounts/:accountId?folder=INBOX&limit=50&offset=0

# Get threads
GET /api/emails/accounts/:accountId/threads?limit=50

# Get single email
GET /api/emails/:emailId

# Search emails
GET /api/emails/accounts/:accountId/search?q=query&folder=INBOX
```

## Automatic Syncing

You can set up automatic syncing:

### Option 1: Cron Job (Recommended for Production)

```typescript
// In your backend, set up a cron job
import { Cron } from '@nestjs/schedule';

@Cron('0 */6 * * *') // Every 6 hours
async syncAllAccounts() {
  await syncService.syncAllAccounts();
}
```

### Option 2: WebSocket Real-time Sync

The system supports WebSocket for real-time updates:

```typescript
// Frontend: Connect to sync gateway
const socket = io('http://localhost:4000');
socket.emit('subscribe', { accountId });

socket.on('new-email', (email) => {
  // New email received!
});

socket.on('sync-status', (status) => {
  // Sync status updated
});
```

## Current Limitations

1. **First Sync** - Only fetches last 7 days of emails (configurable in `email.service.ts` line 42)
2. **Folder Support** - Currently syncs INBOX only (can be extended)
3. **Batch Size** - Fetches 100 emails per sync (configurable in `email.service.ts` line 45)

## Extending Sync to Get All Emails

If you want to fetch ALL emails (not just recent ones):

### Modify `email.service.ts`:

```typescript
// Change line 42-45 to fetch all emails
async syncAccount(accountId: string, syncGateway?: any): Promise<number> {
  // ... existing code ...
  
  // Instead of:
  const lastSync = account.lastSyncAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const emails = await this.imapService.fetchEmails(imap, inboxFolder, 100, lastSync);
  
  // Use:
  const emails = await this.imapService.fetchEmails(imap, inboxFolder, 10000); // No date limit, larger batch
  
  // Or fetch in batches:
  let allEmails: Email[] = [];
  let offset = 0;
  const batchSize = 1000;
  
  while (true) {
    const batch = await this.imapService.fetchEmails(
      imap, 
      inboxFolder, 
      batchSize,
      undefined, // No date filter
      offset
    );
    
    if (batch.length === 0) break;
    allEmails = [...allEmails, ...batch];
    offset += batchSize;
  }
}
```

### Update `imap.service.ts` to support pagination:

```typescript
async fetchEmails(
  imap: Imap, 
  folder: string, 
  limit = 50, 
  since?: Date,
  offset = 0  // Add offset parameter
): Promise<Email[]> {
  // Modify search to include offset
  const uids = results.slice(-limit - offset, -offset || undefined).reverse();
  // ... rest of implementation
}
```

## Best Practices

1. **Initial Sync** - Run a full sync when first connecting an account
2. **Incremental Sync** - Use date-based syncing for regular updates (faster)
3. **Rate Limiting** - Be mindful of IMAP rate limits (especially Gmail)
4. **Error Handling** - IMAP connections can fail, implement retry logic
5. **Caching** - The system already caches email lists and threads

## Troubleshooting

### Emails Not Syncing

1. Check account connection: `GET /api/accounts/:accountId`
2. Check sync status: `GET /api/sync/accounts/:accountId/status`
3. Verify IMAP credentials are correct
4. Check server logs for IMAP connection errors

### Missing Old Emails

- First sync only gets last 7 days by default
- Modify sync logic to fetch all emails (see above)
- Or manually trigger sync with no date limit

### Performance Issues

- Use incremental syncs (date-based) for regular updates
- Cache email lists (already implemented)
- Consider pagination for large inboxes

## Summary

✅ **IMAP is fully handled** - No need to manage protocol directly  
✅ **Just connect account** - OAuth or IMAP credentials  
✅ **Call sync endpoint** - Emails are fetched and stored automatically  
✅ **Query database** - Fast access to all synced emails  

The system handles all the complexity of IMAP connections, email parsing, and storage. You just need to trigger the sync!

