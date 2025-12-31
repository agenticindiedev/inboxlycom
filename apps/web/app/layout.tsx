import type { Metadata } from 'next';
import './globals.scss';

export const metadata: Metadata = {
  title: 'AI Email Client',
  description: 'AI-native email client with smart features',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground">{children}</body>
    </html>
  );
}
