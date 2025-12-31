'use client';

import AIAgentPanel from '@/components/ai-agent-panel';
import ComposeWindow from '@/components/compose-window';
import ConversationView from '@/components/conversation-view';
import InboxList from '@/components/inbox-list';
import { useEmailStore } from '@/lib/stores/email-store';
import { emailsApi } from '@/lib/api';
import { Plus } from 'lucide-react';
import { useState } from 'react';

// TODO: Get from auth context
const MOCK_ACCOUNT_ID = 'account-1';

export default function InboxPage() {
  const [showCompose, setShowCompose] = useState(false);
  const selectedThread = useEmailStore((state) => state.selectedThread);
  const setSelectedEmail = useEmailStore((state) => state.setSelectedEmail);

  const handleReply = async (email: any) => {
    // Set the email as selected and open compose window
    setSelectedEmail(email);
    setShowCompose(true);
  };

  const handleForward = async (email: any) => {
    // TODO: Implement forward functionality
    console.log('Forward email:', email);
  };

  const handleDelete = async (email: any) => {
    // TODO: Implement delete functionality
    if (confirm('Are you sure you want to delete this email?')) {
      console.log('Delete email:', email);
    }
  };

  return (
    <>
      <div className="flex h-full">
        {/* Left Column: Thread List */}
        <div className="flex w-80 flex-col border-r border-border bg-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <h1 className="font-semibold text-xl text-foreground">Inbox</h1>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Compose
            </button>
          </div>
          <InboxList accountId={MOCK_ACCOUNT_ID} />
        </div>

        {/* Middle Column: WhatsApp-style Conversation View */}
        <div className="flex-1 border-r border-border">
          <ConversationView
            accountId={MOCK_ACCOUNT_ID}
            onReply={handleReply}
            onForward={handleForward}
            onDelete={handleDelete}
          />
        </div>

        {/* Right Column: AI Agent Panel */}
        <AIAgentPanel accountId={MOCK_ACCOUNT_ID} />
      </div>

      {showCompose && (
        <ComposeWindow
          accountId={MOCK_ACCOUNT_ID}
          onClose={() => setShowCompose(false)}
          replyTo={
            useEmailStore.getState().selectedEmail
              ? {
                  email: useEmailStore.getState().selectedEmail!.from.address,
                  messageId: useEmailStore.getState().selectedEmail!.messageId,
                  threadId: useEmailStore.getState().selectedEmail!.threadId,
                  subject: useEmailStore.getState().selectedEmail!.subject,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
