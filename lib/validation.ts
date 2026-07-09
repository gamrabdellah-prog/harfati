// Input validation + sanitization helpers shared across forms.
// Mirrors the DB CHECK constraints so we reject bad input before it hits Supabase.

export const sanitizeText = (value: string): string =>
  value.replace(/\u0000/g, '').trim();

export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) return 'البريد الإلكتروني مطلوب';
  if (trimmed.length > 254) return 'البريد الإلكتروني طويل جداً';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return 'البريد الإلكتروني غير صالح';
  return null;
};

export const validatePassword = (password: string): string | null => {
  if (!password) return 'كلمة المرور مطلوبة';
  if (password.length < 8) return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
  if (password.length > 128) return 'كلمة المرور طويلة جداً';
  return null;
};

export const validateFullName = (name: string): string | null => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return 'الاسم الكامل مطلوب (حرفان على الأقل)';
  if (trimmed.length > 100) return 'الاسم طويل جداً (100 حرف كحد أقصى)';
  return null;
};

export const validateTitle = (title: string, min = 3, max = 200): string | null => {
  const trimmed = title.trim();
  if (trimmed.length < min) return `العنوان مطلوب (${min} أحرف على الأقل)`;
  if (trimmed.length > max) return `العنوان طويل جداً (${max} حرف كحد أقصى)`;
  return null;
};

export const validateDescription = (desc: string, min = 10, max = 5000): string | null => {
  const trimmed = desc.trim();
  if (trimmed.length < min) return `الوصف مطلوب (${min} أحرف على الأقل)`;
  if (trimmed.length > max) return `الوصف طويل جداً (${max} حرف كحد أقصى)`;
  return null;
};

export const validateAmount = (amount: string): string | null => {
  if (!amount) return 'المبلغ مطلوب';
  const num = parseInt(amount, 10);
  if (isNaN(num)) return 'المبلغ يجب أن يكون رقماً';
  if (num < 0) return 'المبلغ يجب أن يكون موجباً';
  if (num > 999999999) return 'المبلغ كبير جداً';
  return null;
};

export const validateMessageContent = (content: string): string | null => {
  const trimmed = content.trim();
  if (trimmed.length < 1) return 'الرسالة فارغة';
  if (trimmed.length > 2000) return 'الرسالة طويلة جداً (2000 حرف كحد أقصى)';
  return null;
};

export const validateComment = (comment: string, max = 1000): string | null => {
  if (comment.length > max) return `التعليق طويل جداً (${max} حرف كحد أقصى)`;
  return null;
};
