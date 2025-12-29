'use client';

import { emailsApi } from '@/lib/api';
import { useEmailStore } from '@/lib/stores/email-store';
import { format } from 'date-fns';
import { Mail, MailOpen } from 'lucide-react';
import { useEffect } from 'react';

interface InboxListProps {
  accountId: string;
}

export default function InboxList({ accountId }: InboxListProps) {
  const {
    threads,
    selectedThread,
    setThreads,
    setSelectedThread,
    setSelectedEmail,
    setLoading,
    setError,
    currentFolder,
    loading,
    error,
  } = useEmailStore();

  useEffect(() => {
    loadThreads();
  }, [accountId, currentFolder]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await emailsApi.getThreads(accountId, 50);
      setThreads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load emails');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadClick = (thread: (typeof threads)[0]) => {
    setSelectedThread(thread);
    setSelectedEmail(thread.emails[thread.emails.length - 1] || null);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-card">
        <div className="text-muted-foreground">Loading emails...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-card">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-card">
      {threads.length === 0 ? (
        <div className="flex h-full items-center justify-center text-muted-foreground">No emails found</div>
      ) : (
        threads.map((thread) => {
          const lastEmail = thread.emails[thread.emails.length - 1];
          const isSelected = selectedThread?.id === thread.id;
          const isUnread = thread.unreadCount > 0;

          return (
            <div
              key={thread.id}
              onClick={() => handleThreadClick(thread)}
              className={`cursor-pointer border-b border-border p-4 transition-colors ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}
                ${isUnread ? 'font-semibold' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {isUnread ? (
                    <Mail className="h-5 w-5 text-primary" />
                  ) : (
                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <div className="truncate font-medium text-foreground text-sm">
                      {lastEmail?.from.name || lastEmail?.from.address || 'Unknown'}
                    </div>
                    <div className="ml-2 text-muted-foreground text-xs">
                      {lastEmail?.date ? format(new Date(lastEmail.date), 'MMM d') : ''}
                    </div>
                  </div>
                  <div className="mb-1 truncate text-foreground/80 text-sm">
                    {thread.subject || '(No Subject)'}
                  </div>
                  {lastEmail?.body.text && (
                    <div className="truncate text-muted-foreground text-xs">
                      {lastEmail.body.text.substring(0, 100)}
                      {lastEmail.body.text.length > 100 ? '...' : ''}
                    </div>
                  )}
                  {thread.emails.length > 1 && (
                    <div className="mt-1 text-muted-foreground/70 text-xs">
                      {thread.emails.length} messages
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
