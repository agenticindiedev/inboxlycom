import FolderNavigation from '@/components/folder-navigation';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <FolderNavigation />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
