'use client';

import { useEmailStore } from '@/lib/stores/email-store';
import { format, formatDistanceToNow } from 'date-fns';
import { Bot, Forward, Paperclip, Reply, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Email } from '@/lib/api';

interface ConversationViewProps {
  accountId: string;
  onReply?: (email: Email) => void;
  onForward?: (email: Email) => void;
  onDelete?: (email: Email) => void;
}

export default function ConversationView({
  accountId,
  onReply,
  onForward,
  onDelete,
}: ConversationViewProps) {
  const selectedThread = useEmailStore((state) => state.selectedThread);
  const [hoveredEmailId, setHoveredEmailId] = useState<string | null>(null);

  if (!selectedThread) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 text-muted-foreground">
        <div className="text-center">
          <div className="mb-2 text-4xl">💬</div>
          <div className="text-lg font-medium">Select a conversation</div>
          <div className="text-sm">Choose a thread from the left to view messages</div>
        </div>
      </div>
    );
  }

  // Sort emails by date (oldest first for conversation flow)
  const sortedEmails = [...selectedThread.emails].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const isFromCurrentUser = (email: Email, index: number): boolean => {
    // Heuristic: If this is not the first email in the thread and the previous email
    // was sent TO this email's sender, then this is likely a reply from the current user
    if (index === 0) return false;
    
    const previousEmail = sortedEmails[index - 1];
    const isReply = previousEmail.to.some(
      (addr) => addr.address.toLowerCase() === email.from.address.toLowerCase()
    );
    
    // Also check if the email is addressed to the previous sender (common in email threads)
    const isAddressedToPreviousSender = email.to.some(
      (addr) => addr.address.toLowerCase() === previousEmail.from.address.toLowerCase()
    );
    
    return isReply || isAddressedToPreviousSender;
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Conversation Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="font-semibold text-lg text-foreground">
              {selectedThread.subject || '(No Subject)'}
            </h2>
            <div className="mt-1 flex items-center gap-4 text-muted-foreground text-sm">
              <span>
                {selectedThread.emails.length} {selectedThread.emails.length === 1 ? 'message' : 'messages'}
              </span>
              {selectedThread.unreadCount > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-primary-foreground text-xs font-medium">
                  {selectedThread.unreadCount} unread
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {sortedEmails.map((email, index) => {
            const isUser = isFromCurrentUser(email, index);
            const showDateSeparator =
              index === 0 ||
              new Date(email.date).toDateString() !==
                new Date(sortedEmails[index - 1].date).toDateString();

            return (
              <div key={email.id}>
                {/* Date Separator */}
                {showDateSeparator && (
                  <div className="my-6 flex items-center justify-center">
                    <div className="rounded-full bg-muted px-3 py-1 text-muted-foreground text-xs">
                      {format(new Date(email.date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`group flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  onMouseEnter={() => setHoveredEmailId(email.id)}
                  onMouseLeave={() => setHoveredEmailId(null)}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isUser ? (
                      <span className="font-semibold text-sm">
                        {email.from.name?.[0]?.toUpperCase() || email.from.address[0]?.toUpperCase() || 'U'}
                      </span>
                    ) : (
                      <span className="font-semibold text-sm">
                        {email.from.name?.[0]?.toUpperCase() || email.from.address[0]?.toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>

                  {/* Message Content */}
                  <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {/* Sender Name and Time */}
                    <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <span className="font-medium text-foreground text-sm">
                        {isUser ? 'You' : email.from.name || email.from.address.split('@')[0]}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(email.date), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
                        isUser
                          ? 'bg-primary text-primary-foreground rounded-tr-sm'
                          : 'bg-card border border-border text-foreground rounded-tl-sm'
                      }`}
                    >
                      {/* Email Body */}
                      {email.body.html ? (
                        <div
                          className={`prose prose-sm max-w-none ${
                            isUser ? 'prose-invert' : ''
                          }`}
                          dangerouslySetInnerHTML={{ __html: email.body.html }}
                        />
                      ) : (
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {email.body.text || 'No content'}
                        </div>
                      )}

                      {/* Attachments */}
                      {email.attachments && email.attachments.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {email.attachments.map((att, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-2 rounded-lg border p-2 ${
                                isUser
                                  ? 'border-primary-foreground/20 bg-primary-foreground/10'
                                  : 'border-border bg-muted/50'
                              }`}
                            >
                              <Paperclip className="h-3 w-3" />
                              <span className="text-xs">{att.filename}</span>
                              <span className="text-xs opacity-70">
                                ({(att.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* AI Summary Badge */}
                      {email.aiSummary && (
                        <div className="mt-2 rounded-lg border border-primary/30 bg-primary/10 p-2">
                          <div className="flex items-start gap-2">
                            <Bot className="h-3 w-3 shrink-0 text-primary" />
                            <div className="text-xs">
                              <div className="font-medium text-primary">AI Summary</div>
                              <div className="mt-1 text-foreground/80">{email.aiSummary}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons (on hover) */}
                    {hoveredEmailId === email.id && (
                      <div
                        className={`mt-1 flex gap-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <button
                          onClick={() => onReply?.(email)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-foreground text-xs hover:bg-accent transition-colors"
                          title="Reply"
                        >
                          <Reply className="h-3 w-3" />
                          Reply
                        </button>
                        <button
                          onClick={() => onForward?.(email)}
                          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-foreground text-xs hover:bg-accent transition-colors"
                          title="Forward"
                        >
                          <Forward className="h-3 w-3" />
                          Forward
                        </button>
                        <button
                          onClick={() => onDelete?.(email)}
                          className="flex items-center gap-1.5 rounded-lg border border-destructive/50 bg-card px-3 py-1.5 text-destructive text-xs hover:bg-destructive/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Reply Input (optional - can be added later) */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
              disabled
            />
            <button
              className="rounded bg-primary px-4 py-1.5 text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              disabled
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

