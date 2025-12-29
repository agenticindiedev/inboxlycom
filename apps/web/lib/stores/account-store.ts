import { create } from 'zustand';

export interface EmailAccount {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  lastSyncAt?: string;
  isConnected: boolean;
}

export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

interface AccountStore {
  accounts: EmailAccount[];
  selectedAccountId: string | null;
  loading: boolean;
  error: string | null;

  setAccounts: (accounts: EmailAccount[]) => void;
  addAccount: (account: EmailAccount) => void;
  removeAccount: (accountId: string) => void;
  setSelectedAccountId: (accountId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAccountStore = create<AccountStore>((set) => ({
  accounts: [],
  selectedAccountId: null,
  loading: false,
  error: null,

  setAccounts: (accounts) => set({ accounts }),
  addAccount: (account) =>
    set((state) => ({
      accounts: [...state.accounts, account],
      selectedAccountId: state.selectedAccountId || account.id,
    })),
  removeAccount: (accountId) =>
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== accountId),
      selectedAccountId:
        state.selectedAccountId === accountId
          ? state.accounts.find((a) => a.id !== accountId)?.id || null
          : state.selectedAccountId,
    })),
  setSelectedAccountId: (accountId) => set({ selectedAccountId: accountId }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
