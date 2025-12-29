'use client';

import ComposeWindow from '@/components/compose-window';
import EmailReader from '@/components/email-reader';
import InboxList from '@/components/inbox-list';
import { Plus } from 'lucide-react';
import { useState } from 'react';

// TODO: Get from auth context
const MOCK_ACCOUNT_ID = 'account-1';

export default function InboxPage() {
  const [showCompose, setShowCompose] = useState(false);

  return (
    <>
      <div className="flex h-full">
        {/* Inbox List */}
        <div className="flex w-96 flex-col border-r">
          <div className="flex items-center justify-between border-b p-4">
            <h1 className="font-semibold text-xl">Inbox</h1>
            <button
              onClick={() => setShowCompose(true)}
              className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Compose
            </button>
          </div>
          <InboxList accountId={MOCK_ACCOUNT_ID} />
        </div>

        {/* Email Reader */}
        <div className="flex-1">
          <EmailReader />
        </div>
      </div>

      {showCompose && (
        <ComposeWindow accountId={MOCK_ACCOUNT_ID} onClose={() => setShowCompose(false)} />
      )}
    </>
  );
}
