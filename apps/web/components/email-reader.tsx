'use client';

import { useEmailStore } from '@/lib/stores/email-store';
import { format } from 'date-fns';
import { Forward, Reply, Trash2 } from 'lucide-react';

export default function EmailReader() {
  const selectedEmail = useEmailStore((state) => state.selectedEmail);
  const selectedThread = useEmailStore((state) => state.selectedThread);

  if (!selectedEmail) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Select an email to view
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Email Header */}
      <div className="border-b border-border bg-card p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="mb-2 font-semibold text-xl text-foreground">
              {selectedEmail.subject || '(No Subject)'}
            </h2>
            <div className="text-muted-foreground text-sm">
              <div>
                <span className="font-medium text-foreground">From:</span>{' '}
                {selectedEmail.from.name
                  ? `${selectedEmail.from.name} <${selectedEmail.from.address}>`
                  : selectedEmail.from.address}
              </div>
              {selectedEmail.to.length > 0 && (
                <div className="mt-1">
                  <span className="font-medium text-foreground">To:</span>{' '}
                  {selectedEmail.to
                    .map((addr) => (addr.name ? `${addr.name} <${addr.address}>` : addr.address))
                    .join(', ')}
                </div>
              )}
              {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                <div className="mt-1">
                  <span className="font-medium text-foreground">Cc:</span>{' '}
                  {selectedEmail.cc
                    .map((addr) => (addr.name ? `${addr.name} <${addr.address}>` : addr.address))
                    .join(', ')}
                </div>
              )}
              <div className="mt-1">
                <span className="font-medium text-foreground">Date:</span>{' '}
                {format(new Date(selectedEmail.date), 'PPpp')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded border border-border px-4 py-2 text-foreground hover:bg-accent">
            <Reply className="h-4 w-4" />
            Reply
          </button>
          <button className="flex items-center gap-2 rounded border border-border px-4 py-2 text-foreground hover:bg-accent">
            <Forward className="h-4 w-4" />
            Forward
          </button>
          <button className="flex items-center gap-2 rounded border border-border px-4 py-2 text-destructive hover:bg-accent">
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Email Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedEmail.body.html ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedEmail.body.html }}
          />
        ) : (
          <div className="whitespace-pre-wrap text-foreground">
            {selectedEmail.body.text || 'No content'}
          </div>
        )}

        {/* AI Summary */}
        {selectedEmail.aiSummary && (
          <div className="mt-8 rounded border border-primary/30 bg-primary/10 p-4">
            <h3 className="mb-2 font-semibold text-primary">AI Summary</h3>
            <p className="text-foreground/80 text-sm">{selectedEmail.aiSummary}</p>
          </div>
        )}

        {/* Attachments */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mt-8">
            <h3 className="mb-2 font-semibold text-foreground">Attachments</h3>
            <div className="space-y-2">
              {selectedEmail.attachments.map((att, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded border border-border p-2 hover:bg-accent"
                >
                  <span className="text-sm text-foreground">{att.filename}</span>
                  <span className="text-muted-foreground text-xs">({(att.size / 1024).toFixed(1)} KB)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Thread View */}
        {selectedThread && selectedThread.emails.length > 1 && (
          <div className="mt-8 border-t border-border pt-8">
            <h3 className="mb-4 font-semibold text-foreground">Thread ({selectedThread.emails.length} messages)</h3>
            <div className="space-y-4">
              {selectedThread.emails
                .slice()
                .reverse()
                .map((email, _idx) => (
                  <div
                    key={email.id}
                    className={`rounded border p-4 ${
                      email.id === selectedEmail.id ? 'border-primary/30 bg-primary/10' : 'border-border bg-accent/50'
                    }`}
                  >
                    <div className="mb-1 font-medium text-sm text-foreground">
                      {email.from.name || email.from.address}
                    </div>
                    <div className="mb-2 text-muted-foreground text-xs">
                      {format(new Date(email.date), 'PPpp')}
                    </div>
                    <div className="text-foreground/80 text-sm">
                      {email.body.text?.substring(0, 200) || email.body.html?.substring(0, 200)}
                      {(email.body.text?.length || email.body.html?.length || 0) > 200 ? '...' : ''}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
