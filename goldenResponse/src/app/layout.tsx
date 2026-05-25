import type {Metadata} from 'next';
import './globals.css';
import { AppSessionProvider } from '@/components/providers/SessionProvider';

export const metadata: Metadata = {
  title: 'Ethara Board | Anonymous Infinite Whiteboard',
  description: 'A fun, anonymous infinite drawing board for strangers.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AppSessionProvider>{children}</AppSessionProvider>
      </body>
    </html>
  );
}
