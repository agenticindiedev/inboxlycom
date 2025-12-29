'use client';

import { useEmailStore } from '@/lib/stores/email-store';
import { Archive, Inbox, Send, Settings, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const folders = [
  { id: 'INBOX', name: 'Inbox', icon: Inbox },
  { id: 'STARRED', name: 'Starred', icon: Star },
  { id: 'SENT', name: 'Sent', icon: Send },
  { id: 'ARCHIVE', name: 'Archive', icon: Archive },
  { id: 'TRASH', name: 'Trash', icon: Trash2 },
];

export default function FolderNavigation() {
  const currentFolder = useEmailStore((state) => state.currentFolder);
  const setCurrentFolder = useEmailStore((state) => state.setCurrentFolder);
  const pathname = usePathname();
  const isSettingsPage = pathname === '/settings';

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <h2 className="font-semibold text-lg text-foreground">Folders</h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = currentFolder === folder.id && !isSettingsPage;

          return (
            <Link
              key={folder.id}
              href="/inbox"
              onClick={() => setCurrentFolder(folder.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-primary/20 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{folder.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <Link
          href="/settings"
          className={`flex w-full items-center gap-3 rounded px-3 py-2 transition-colors ${
            isSettingsPage
              ? 'bg-primary/20 font-medium text-primary'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}
