export const sanitizeText = (v: string) => v.replace(/\u0000/g, '').trim();

export const validateEmail = (email: string): string | null => {
  const t = email.trim();
  if (!t) return 'البريد الإلكتروني مطلوب';
  if (t.length > 254) return 'البريد الإلكتروني طويل جداً';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'البريد الإلكتروني غير صالح';
  return null;
};
export const validatePassword = (p: string): string | null => {
  if (!p) return 'كلمة المرور مطلوبة';
  if (p.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  if (p.length > 128) return 'كلمة المرور طويلة جداً';
  return null;
};
export const validateFullName = (n: string): string | null => {
  const t = n.trim();
  if (t.length < 2) return 'الاسم الكامل مطلوب (حرفان على الأقل)';
  if (t.length > 100) return 'الاسم طويل جداً';
  return null;
};
export const validateTitle = (title: string, min = 3, max = 200): string | null => {
  const t = title.trim();
  if (t.length < min) return `العنوان مطلوب (${min} أحرف على الأقل)`;
  if (t.length > max) return `العنوان طويل جداً`;
  return null;
};
export const validateDescription = (d: string, min = 10, max = 5000): string | null => {
  const t = d.trim();
  if (t.length < min) return `الوصف مطلوب (${min} أحرف على الأقل)`;
  if (t.length > max) return 'الوصف طويل جداً';
  return null;
};
export const validateAmount = (a: string): string | null => {
  if (!a) return 'المبلغ مطلوب';
  const n = parseInt(a, 10);
  if (isNaN(n) || n < 0) return 'المبلغ يجب أن يكون رقماً موجباً';
  return null;
};
export const validateMessageContent = (c: string): string | null => {
  if (!c.trim()) return 'الرسالة فارغة';
  if (c.length > 2000) return 'الرسالة طويلة جداً';
  return null;
};
export const validateComment = (c: string, max = 1000): string | null => {
  if (c.length > max) return `التعليق طويل جداً`;
  return null;
};
