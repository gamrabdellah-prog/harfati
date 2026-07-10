export const sanitizeText = (v: string) => v.replace(/\u0000/g, '').trim();
export const validateEmail = (e: string) => { const t = e.trim(); if (!t) return 'البريد مطلوب'; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return 'البريد غير صالح'; return null; };
export const validatePassword = (p: string) => { if (!p || p.length < 8) return 'كلمة المرور 8 أحرف على الأقل'; return null; };
export const validateFullName = (n: string) => { if (!n.trim() || n.trim().length < 2) return 'الاسم مطلوب'; return null; };
export const validateTitle = (t: string) => { if (!t.trim() || t.trim().length < 3) return 'العنوان مطلوب'; return null; };
export const validateDescription = (d: string) => { if (!d.trim() || d.trim().length < 10) return 'الوصف مطلوب (10 أحرف على الأقل)'; return null; };
export const validateAmount = (a: string) => { if (!a || isNaN(parseInt(a)) || parseInt(a) < 0) return 'المبلغ يجب أن يكون رقماً موجباً'; return null; };
export const validateMessageContent = (c: string) => { if (!c.trim()) return 'الرسالة فارغة'; if (c.length > 2000) return 'الرسالة طويلة جداً'; return null; };
