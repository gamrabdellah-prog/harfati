import './globals.css';
import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { AuthProvider } from './providers';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  display: 'swap',
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'حرفتي — منصة الحرفيين الجزائرية',
  description: 'اكتشف أفضل الحرفيين والمهنيين في كل ولايات الجزائر',
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="font-arabic min-h-screen bg-background antialiased">
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-64px)]">{children}</main>
          <Toaster
            position="top-center"
            richColors
            expand
            toastOptions={{
              style: { fontFamily: 'Tajawal, sans-serif', direction: 'rtl', borderRadius: '16px' },
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
