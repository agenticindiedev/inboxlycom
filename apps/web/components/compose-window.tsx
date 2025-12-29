'use client';

import { emailsApi } from '@/lib/api';
import { Paperclip, Send, X } from 'lucide-react';
import { useState } from 'react';

interface ComposeWindowProps {
  accountId: string;
  onClose: () => void;
  replyTo?: {
    email: string;
    messageId: string;
    threadId: string;
  };
}

export default function ComposeWindow({ accountId, onClose, replyTo }: ComposeWindowProps) {
  const [to, setTo] = useState(replyTo?.email || '');
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject || ''}` : '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!(to && subject && body)) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSending(true);
      await emailsApi.sendEmail(accountId, {
        to: [{ address: to }],
        subject,
        body: { text: body },
        inReplyTo: replyTo?.messageId,
        references: replyTo ? [replyTo.messageId] : undefined,
      });
      onClose();
    } catch (error) {
      alert(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="font-semibold text-lg">{replyTo ? 'Reply' : 'Compose'}</h2>
          <button onClick={onClose} className="rounded p-2 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="space-y-3 border-b p-4">
            <div>
              <label className="mb-1 block font-medium text-sm">To</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-sm">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Body Editor */}
          <div className="flex flex-1 flex-col">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full flex-1 resize-none border-0 p-4 focus:outline-none"
              placeholder="Write your message here..."
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t p-4">
            <div className="flex gap-2">
              <button className="rounded p-2 hover:bg-gray-100">
                <Paperclip className="h-5 w-5" />
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded border px-4 py-2 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
