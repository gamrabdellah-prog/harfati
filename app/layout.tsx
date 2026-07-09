import './globals.css';
import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { AuthProvider } from './providers';
import { Navbar } from '@/components/navbar';
import { Toaster } from '@/components/ui/sonner';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'حرفتي - منصة الحرفيين الجزائرية',
  description: 'منصة جزائرية تربط الحرفيين وأصحاب العمل في الجزائر',
  metadataBase: new URL('https://harafati.vercel.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className}>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 page-enter">{children}</main>
            <Toaster position="top-left" />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
