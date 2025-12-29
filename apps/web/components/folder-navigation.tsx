'use client';

import { useEmailStore } from '@/lib/stores/email-store';
import { Archive, Inbox, Sent, Star, Trash2 } from 'lucide-react';

const folders = [
  { id: 'INBOX', name: 'Inbox', icon: Inbox },
  { id: 'STARRED', name: 'Starred', icon: Star },
  { id: 'SENT', name: 'Sent', icon: Sent },
  { id: 'ARCHIVE', name: 'Archive', icon: Archive },
  { id: 'TRASH', name: 'Trash', icon: Trash2 },
];

export default function FolderNavigation() {
  const currentFolder = useEmailStore((state) => state.currentFolder);
  const setCurrentFolder = useEmailStore((state) => state.setCurrentFolder);

  return (
    <div className="flex h-full w-64 flex-col border-r bg-gray-50">
      <div className="border-b p-4">
        <h2 className="font-semibold text-lg">Folders</h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {folders.map((folder) => {
          const Icon = folder.icon;
          const isActive = currentFolder === folder.id;

          return (
            <button
              key={folder.id}
              onClick={() => setCurrentFolder(folder.id)}
              className={`mb-1 flex w-full items-center gap-3 rounded px-3 py-2 transition-colors ${
                isActive
                  ? 'bg-blue-100 font-medium text-blue-900'
                  : 'text-gray-700 hover:bg-gray-100'
              }
              `}
            >
              <Icon className="h-5 w-5" />
              <span>{folder.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
