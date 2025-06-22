import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { BottomNav } from '@/components/layout/bottom-nav';
import { AuthProvider } from '@/context/auth-provider';
import { ThemeProvider } from '@/context/theme-provider';
import { PinLockProvider } from '@/context/pin-lock-provider';
import { PinLockOverlay } from '@/components/pin-lock-overlay';

export const metadata: Metadata = {
  title: 'Time Warp Tracker',
  description: 'A retro-themed time tracking and management web application.',
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
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-sans antialiased", "bg-background text-foreground")}>
        <AuthProvider>
          <ThemeProvider>
            <PinLockProvider>
              <Header />
              <main className="p-4 sm:p-6 lg:p-8 pb-24">
                {children}
              </main>
              <BottomNav />
              <Toaster />
              <PinLockOverlay />
            </PinLockProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
