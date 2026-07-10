import './globals.css';
import type { Metadata } from 'next';
import { Tajawal } from 'next/font/google';
import { AuthProvider } from './providers';
import { Navbar } from '@/components/navbar';
import { Toaster } from 'sonner';

const tajawal = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'حرفتي - منصة الحرفيين الجزائرية',
  description: 'منصة جزائرية تربط الحرفيين وأصحاب العمل في كل ولايات الجزائر',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.className}>
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
