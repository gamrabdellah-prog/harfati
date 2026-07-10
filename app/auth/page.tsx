'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateFullName, sanitizeText } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AuthPage() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(sp.get('tab') === 'register' ? 'register' : 'login');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();
  useEffect(() => { if (user) router.push('/'); }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ee = validateEmail(email); if (ee) { toast.error(ee); return; }
    const pe = validatePassword(password); if (pe) { toast.error(pe); return; }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) toast.error(error.message.includes('Invalid') ? 'البريد أو كلمة المرور غير صحيحة' : error.message);
    else { toast.success('مرحباً بك! 👋'); router.push('/'); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const ne = validateFullName(fullName); if (ne) { toast.error(ne); return; }
    const ee = validateEmail(email); if (ee) { toast.error(ee); return; }
    const pe = validatePassword(password); if (pe) { toast.error(pe); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, role, sanitizeText(fullName));
    setLoading(false);
    if (error) toast.error(error.message);
    else { toast.success('🎉 تم إنشاء حسابك!'); setTab('login'); }
  };

  const PERKS = [
    { icon: '🔨', text: 'أكثر من 130 تخصصاً مهنياً' },
    { icon: '🗺️', text: 'تغطية شاملة لـ 48 ولاية' },
    { icon: '📄', text: 'عقود رقمية آمنة وموثقة' },
    { icon: '⭐', text: 'تقييمات حقيقية وموثوقة' },
    { icon: '💬', text: 'تواصل مباشر وفوري' },
  ];

  return (
    <div className="min-h-screen flex" style={{ minHeight: 'calc(100vh - 64px)' }}>
      <div className="hidden lg:flex flex-col w-[48%] bg-hero noise relative overflow-hidden">
        <div className="absolute top-20 right-10 h-80 w-80 rounded-full bg-orange-500/12 blur-3xl" />
        <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-orange-700/12 blur-3xl" />
        <div className="absolute inset-0 pattern-hero" />
        <div className="relative z-10 flex flex-col h-full p-12">
          <Link href="/" className="flex items-center gap-3 mb-auto">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center shadow-glow-sm"><span className="text-xl">🔨</span></div>
            <span className="font-black text-2xl text-white"><span className="text-orange-400">حرف</span>تي</span>
          </Link>
          <div className="my-auto">
            <h2 className="text-5xl font-black text-white leading-tight mb-6">انضم إلى<br /><span className="text-gradient-fire">مجتمع</span><br />الكفاءات</h2>
            <p className="text-white/45 text-lg leading-relaxed mb-10">المنصة الأولى التي تربط الكفاءات المهرة بأصحاب العمل في كل الجزائر</p>
            <div className="space-y-4">
              {PERKS.map((p, i) => (
                <div key={i} className="flex items-center gap-4 glass-dark rounded-2xl px-5 py-3.5 border border-white/5">
                  <span className="text-xl w-8 text-center">{p.icon}</span>
                  <span className="text-white/70 text-sm font-medium">{p.text}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-auto text-white/20 text-xs">© 2026 حرفتي</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-muted/20">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-700 flex items-center justify-center shadow-orange"><span className="text-2xl">🔨</span></div>
              <span className="font-black text-2xl"><span className="text-gradient-orange">حرف</span>تي</span>
            </Link>
          </div>

          <div className="flex bg-white rounded-2xl p-1.5 shadow-card border border-border/60 mb-8">
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all duration-200', tab === t ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-orange' : 'text-muted-foreground hover:text-foreground')}>
                {t === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-3xl shadow-card-hover border border-border/60 p-8">
            {tab === 'login' ? (
              <>
                <div className="mb-8"><h1 className="text-2xl font-black mb-2">مرحباً بعودتك 👋</h1><p className="text-muted-foreground text-sm">أدخل بياناتك للدخول إلى حسابك</p></div>
                <form onSubmit={handleLogin} className="space-y-5">
                  <div><Label>البريد الإلكتروني</Label><Input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                  <div><Label>كلمة المرور</Label><div className="relative"><Input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                  <Button type="submit" variant="premium" size="lg" className="w-full rounded-2xl mt-2" disabled={loading}>{loading && <Loader2 className="h-5 w-5 animate-spin ml-2" />}تسجيل الدخول</Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">ليس لديك حساب؟ <button onClick={() => setTab('register')} className="text-orange-600 font-bold hover:underline">أنشئ حساباً مجانياً</button></p>
              </>
            ) : (
              <>
                <div className="mb-8"><h1 className="text-2xl font-black mb-2">إنشاء حساب 🚀</h1><p className="text-muted-foreground text-sm">مجاناً — لا بطاقة بنكية مطلوبة</p></div>
                <form onSubmit={handleRegister} className="space-y-5">
                  <div>
                    <Label>نوع الحساب</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {([['worker', '🔨', 'كفاءة / عامل', 'أعرض مهاراتك'], ['employer', '🏢', 'صاحب عمل', 'انشر وظائف']] as const).map(([r, icon, title, sub]) => (
                        <button key={r} type="button" onClick={() => setRole(r as 'worker' | 'employer')} className={cn('relative flex flex-col items-center gap-2.5 py-5 px-4 rounded-2xl border-2 transition-all text-center', role === r ? 'border-orange-500 bg-orange-50/50 shadow-glow-sm' : 'border-border bg-white hover:border-orange-200')}>
                          {role === r && <div className="absolute top-2.5 right-2.5 h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                          <span className="text-2xl">{icon}</span>
                          <div><p className={cn('text-sm font-bold', role === r ? 'text-orange-700' : 'text-foreground')}>{title}</p><p className="text-xs text-muted-foreground mt-0.5">{sub}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><Label>الاسم الكامل</Label><Input placeholder="أحمد بن محمد" value={fullName} onChange={e => setFullName(e.target.value)} required /></div>
                  <div><Label>البريد الإلكتروني</Label><Input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                  <div><Label>كلمة المرور</Label><div className="relative"><Input type={showPass ? 'text' : 'password'} placeholder="8 أحرف على الأقل" value={password} onChange={e => setPassword(e.target.value)} required /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
                  <Button type="submit" variant="premium" size="lg" className="w-full rounded-2xl gap-2 mt-2" disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}إنشاء حسابي مجاناً</Button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-6">لديك حساب؟ <button onClick={() => setTab('login')} className="text-orange-600 font-bold hover:underline">سجّل دخولك</button></p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
