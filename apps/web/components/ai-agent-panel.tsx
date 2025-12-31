'use client';

import { useEmailStore } from '@/lib/stores/email-store';
import { aiApi } from '@/lib/api';
import { Bot, Loader2, MessageSquare, Send, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { Email } from '@/lib/api';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAgentPanelProps {
  accountId: string;
}

export default function AIAgentPanel({ accountId }: AIAgentPanelProps) {
  const selectedThread = useEmailStore((state) => state.selectedThread);
  const selectedEmail = useEmailStore((state) => state.selectedEmail);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !selectedThread) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      // Try to use AI API - for now, we'll use summarize thread as a fallback
      // You can create a dedicated chat endpoint later
      let response: string;

      if (currentInput.toLowerCase().includes('summarize') || currentInput.toLowerCase().includes('summary')) {
        const result = await aiApi.summarizeThread(
          selectedThread.emails.map((email) => ({
            subject: email.subject,
            body: email.body.text || email.body.html || '',
            from: email.from.address,
            date: email.date,
          }))
        );
        response = result.summary;
      } else if (currentInput.toLowerCase().includes('draft') || currentInput.toLowerCase().includes('reply')) {
        const lastEmail = selectedThread.emails[selectedThread.emails.length - 1];
        const result = await aiApi.generateReply(
          {
            subject: lastEmail.subject,
            body: lastEmail.body.text || lastEmail.body.html || '',
            from: lastEmail.from.address,
          },
          selectedThread.emails.map((e) => e.body.text || e.body.html || '').join('\n\n'),
          'professional'
        );
        response = result.reply;
      } else {
        // Generic response - you can create a chat endpoint for this
        response = `I understand you're asking about this conversation. Here's what I can help with:\n\n- Summarize the thread\n- Draft a reply\n- Identify action items\n- Prioritize the conversation\n\nTry asking me to "summarize this thread" or "draft a reply".`;
      }

      const aiMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (action: string) => {
    if (!selectedThread) return;

    setIsLoading(true);
    try {
      let response: string;

      switch (action) {
        case 'summarize': {
          const result = await aiApi.summarizeThread(
            selectedThread.emails.map((email) => ({
              subject: email.subject,
              body: email.body.text || email.body.html || '',
              from: email.from.address,
              date: email.date,
            }))
          );
          response = result.summary;
          break;
        }
        case 'draft': {
          const lastEmail = selectedThread.emails[selectedThread.emails.length - 1];
          const result = await aiApi.generateReply(
            {
              subject: lastEmail.subject,
              body: lastEmail.body.text || lastEmail.body.html || '',
              from: lastEmail.from.address,
            },
            selectedThread.emails.map((e) => e.body.text || e.body.html || '').join('\n\n'),
            'professional'
          );
          response = `Here's a draft reply:\n\n${result.reply}`;
          break;
        }
        case 'prioritize':
          response = `Priority analysis:\n\n- This thread has ${selectedThread.emails.length} messages\n- ${selectedThread.unreadCount} unread message(s)\n- Last activity: ${new Date(selectedThread.lastEmailDate).toLocaleDateString()}\n\nConsider: ${selectedThread.unreadCount > 0 ? 'High priority - has unread messages' : 'Medium priority'}`;
          break;
        case 'action':
          response = `Action items from this thread:\n\n- Review the conversation for specific action items\n- Check for deadlines or follow-up requests\n- Consider replying to address any questions\n\nUse "Summarize" for a detailed breakdown.`;
          break;
        default:
          response = 'Action completed.';
      }

      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isMinimized) {
    return (
      <div className="flex h-full flex-col border-l border-border bg-card">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 border-b border-border bg-primary/10 p-4 text-left hover:bg-primary/20 transition-colors"
        >
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium text-foreground">AI Assistant</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full w-96 flex-col border-l border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <p className="text-muted-foreground text-xs">Powered by AI</p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="rounded-lg p-1.5 hover:bg-accent transition-colors"
          title="Minimize"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      {/* Context Info */}
      {selectedThread && (
        <div className="border-b border-border bg-muted/30 p-3">
          <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Active Thread
          </div>
          <div className="mt-1 truncate font-medium text-foreground text-sm">
            {selectedThread.subject || '(No Subject)'}
          </div>
          <div className="mt-1 text-muted-foreground text-xs">
            {selectedThread.emails.length} {selectedThread.emails.length === 1 ? 'message' : 'messages'}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {selectedThread && (
        <div className="border-b border-border p-3">
          <div className="mb-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Quick Actions
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickAction('summarize')}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-foreground text-xs hover:bg-accent transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Summarize
            </button>
            <button
              onClick={() => handleQuickAction('draft')}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-foreground text-xs hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              Draft Reply
            </button>
            <button
              onClick={() => handleQuickAction('prioritize')}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-foreground text-xs hover:bg-accent transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Prioritize
            </button>
            <button
              onClick={() => handleQuickAction('action')}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-left text-foreground text-xs hover:bg-accent transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              Action Items
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-4">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <h4 className="mb-2 font-medium text-foreground">AI Assistant Ready</h4>
            <p className="text-muted-foreground text-sm">
              {selectedThread
                ? 'Ask me anything about this conversation or use quick actions above.'
                : 'Select a conversation to get started with AI assistance.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    message.role === 'assistant'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">U</span>
                  )}
                </div>
                <div
                  className={`flex flex-col gap-1 ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  } max-w-[85%]`}
                >
                  <div
                    className={`rounded-2xl px-3 py-2 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-muted-foreground text-sm">Thinking...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask AI anything..."
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-foreground text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isLoading || !selectedThread}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim() || !selectedThread}
            className="rounded-lg bg-primary p-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        {!selectedThread && (
          <p className="mt-2 text-muted-foreground text-xs">
            Select a conversation to start chatting with AI
          </p>
        )}
      </div>
    </div>
  );
}

