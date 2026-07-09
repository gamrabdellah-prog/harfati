'use client';

import { AuthProvider } from './providers';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Toaster position="top-left" />
      </div>
    </AuthProvider>
  );
}
