import { create } from 'zustand';
import type { Email, EmailThread } from '../api';

interface EmailStore {
  // State
  threads: EmailThread[];
  selectedThread: EmailThread | null;
  selectedEmail: Email | null;
  currentFolder: string;
  loading: boolean;
  error: string | null;

  // Actions
  setThreads: (threads: EmailThread[]) => void;
  setSelectedThread: (thread: EmailThread | null) => void;
  setSelectedEmail: (email: Email | null) => void;
  setCurrentFolder: (folder: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addThread: (thread: EmailThread) => void;
  updateThread: (threadId: string, updates: Partial<EmailThread>) => void;
}

export const useEmailStore = create<EmailStore>((set) => ({
  // Initial state
  threads: [],
  selectedThread: null,
  selectedEmail: null,
  currentFolder: 'INBOX',
  loading: false,
  error: null,

  // Actions
  setThreads: (threads) => set({ threads }),
  setSelectedThread: (thread) => set({ selectedThread: thread }),
  setSelectedEmail: (email) => set({ selectedEmail: email }),
  setCurrentFolder: (folder) => set({ currentFolder: folder }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  addThread: (thread) =>
    set((state) => ({
      threads: [thread, ...state.threads],
    })),
  updateThread: (threadId, updates) =>
    set((state) => ({
      threads: state.threads.map((t) => (t.id === threadId ? { ...t, ...updates } : t)),
    })),
}));
