import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const formatNumber = (n: number) => n.toLocaleString('ar-DZ');
export const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatTime = (d: string) => new Date(d).toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' });
export const formatDateShort = (d: string) => new Date(d).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' });

export const sanitizeText = (v: string) => v.replace(/\u0000/g, '').trim();

export const validateEmail = (e: string): string | null => {
  const t = e.trim();
  if (!t) return 'البريد الإلكتروني مطلوب';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'البريد الإلكتروني غير صالح';
  return null;
};
export const validatePassword = (p: string): string | null => {
  if (!p || p.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  return null;
};
export const validateFullName = (n: string): string | null => {
  if (!n.trim() || n.trim().length < 2) return 'الاسم الكامل مطلوب';
  return null;
};
export const validateTitle = (t: string): string | null => {
  if (!t.trim() || t.trim().length < 3) return 'العنوان مطلوب (3 أحرف على الأقل)';
  return null;
};
export const validateAmount = (a: string): string | null => {
  if (!a || isNaN(parseInt(a)) || parseInt(a) < 0) return 'المبلغ يجب أن يكون رقماً صحيحاً';
  return null;
};
export const validateMessage = (c: string): string | null => {
  if (!c.trim()) return 'الرسالة فارغة';
  if (c.length > 2000) return 'الرسالة طويلة جداً';
  return null;
};
