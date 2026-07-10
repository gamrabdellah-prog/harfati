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
  return null;
};

export const validateFullName = (n: string): string | null => {
  const t = n.trim();
  if (t.length < 2) return 'الاسم الكامل مطلوب';
  if (t.length > 100) return 'الاسم طويل جداً';
  return null;
};

export const validateTitle = (title: string): string | null => {
  if (!title.trim() || title.trim().length < 3) return 'العنوان مطلوب (3 أحرف على الأقل)';
  if (title.length > 200) return 'العنوان طويل جداً';
  return null;
};

export const validateDescription = (d: string): string | null => {
  if (!d.trim() || d.trim().length < 10) return 'الوصف مطلوب (10 أحرف على الأقل)';
  if (d.length > 5000) return 'الوصف طويل جداً';
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
