'use client';

import { accountsApi, type EmailAccount } from '@/lib/api';
import { AlertCircle, Check, Loader2, Mail, Plus, Server, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ImapFormData {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
}

const defaultImapForm: ImapFormData = {
  email: '',
  password: '',
  imapHost: '',
  imapPort: 993,
  imapSecure: true,
  smtpHost: '',
  smtpPort: 587,
  smtpSecure: true,
};

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState<'google' | 'imap' | null>(null);
  const [imapForm, setImapForm] = useState<ImapFormData>(defaultImapForm);
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountsApi.getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const { url } = await accountsApi.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get Google auth URL');
    }
  };

  const handleAddImap = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const newAccount = await accountsApi.createImapAccount(imapForm);
      setAccounts([...accounts, newAccount]);
      setShowAddModal(false);
      setModalType(null);
      setImapForm(defaultImapForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to remove this account?')) return;

    try {
      await accountsApi.deleteAccount(accountId);
      setAccounts(accounts.filter((a) => a.id !== accountId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    }
  };

  const handleTestConnection = async (accountId: string) => {
    try {
      setTestingId(accountId);
      setTestResult(null);
      const result = await accountsApi.testConnection(accountId);
      setTestResult({ id: accountId, ...result });
    } catch (err) {
      setTestResult({ id: accountId, success: false, error: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTestingId(null);
    }
  };

  const openAddModal = (type: 'google' | 'imap') => {
    setModalType(type);
    setShowAddModal(true);
    if (type === 'google') {
      handleConnectGoogle();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-foreground">Settings</h1>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Connected Accounts</h2>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : accounts.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center">
              <Mail className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="mb-4 text-muted-foreground">No email accounts connected yet.</p>
              <p className="text-sm text-muted-foreground">Connect an account to start reading your emails.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        account.provider === 'gmail' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {account.provider === 'gmail' ? <Mail className="h-5 w-5" /> : <Server className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{account.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {account.provider === 'gmail' ? 'Google' : 'IMAP'} •{' '}
                        {account.lastSyncAt ? `Last sync: ${new Date(account.lastSyncAt).toLocaleString()}` : 'Never synced'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {testResult?.id === account.id && (
                      <span
                        className={`flex items-center gap-1 text-sm ${testResult.success ? 'text-green-500' : 'text-destructive'}`}
                      >
                        {testResult.success ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        {testResult.success ? 'Connected' : testResult.error}
                      </span>
                    )}
                    <button
                      onClick={() => handleTestConnection(account.id)}
                      disabled={testingId === account.id}
                      className="rounded px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      {testingId === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test'}
                    </button>
                    <button
                      onClick={() => handleDeleteAccount(account.id)}
                      className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => openAddModal('google')}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-accent"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Connect Google
            </button>
            <button
              onClick={() => openAddModal('imap')}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-foreground transition-colors hover:bg-accent"
            >
              <Server className="h-5 w-5" />
              Add IMAP Server
            </button>
          </div>
        </section>
      </div>

      {showAddModal && modalType === 'imap' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Add IMAP Account</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setModalType(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddImap} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Email Address</label>
                <input
                  type="email"
                  value={imapForm.email}
                  onChange={(e) => setImapForm({ ...imapForm, email: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-foreground">Password</label>
                <input
                  type="password"
                  value={imapForm.password}
                  onChange={(e) => setImapForm({ ...imapForm, password: e.target.value })}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Your email password or app password"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">IMAP Host</label>
                  <input
                    type="text"
                    value={imapForm.imapHost}
                    onChange={(e) => setImapForm({ ...imapForm, imapHost: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="imap.example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">IMAP Port</label>
                  <input
                    type="number"
                    value={imapForm.imapPort}
                    onChange={(e) => setImapForm({ ...imapForm, imapPort: Number(e.target.value) })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">SMTP Host</label>
                  <input
                    type="text"
                    value={imapForm.smtpHost}
                    onChange={(e) => setImapForm({ ...imapForm, smtpHost: e.target.value })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="smtp.example.com"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">SMTP Port</label>
                  <input
                    type="number"
                    value={imapForm.smtpPort}
                    onChange={(e) => setImapForm({ ...imapForm, smtpPort: Number(e.target.value) })}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={imapForm.imapSecure}
                    onChange={(e) => setImapForm({ ...imapForm, imapSecure: e.target.checked })}
                    className="rounded border-border"
                  />
                  IMAP SSL/TLS
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={imapForm.smtpSecure}
                    onChange={(e) => setImapForm({ ...imapForm, smtpSecure: e.target.checked })}
                    className="rounded border-border"
                  />
                  SMTP SSL/TLS
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setModalType(null);
                  }}
                  className="rounded-lg px-4 py-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
