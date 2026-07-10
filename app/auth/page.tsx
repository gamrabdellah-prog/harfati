'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateFullName, sanitizeText } from '@/lib/validation';
import { cn } from '@/lib/utils';

const BENEFITS = ['أكثر من 1000 حرفي متخصص', 'تغطية كاملة 48 ولاية', 'عقود رقمية آمنة', 'تقييمات موثوقة'];

export default function AuthPage() {
  const sp = useSearchParams();
  const [tab, setTab] = useState<'login'|'register'>(sp.get('tab') === 'register' ? 'register' : 'login');
  const [role, setRole] = useState<'worker'|'employer'>('worker');
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
    else { toast.success('تم إنشاء حسابك بنجاح! 🎉'); setTab('login'); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — visual */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] hero-gradient noise p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 h-72 w-72 rounded-full bg-orange-400/20 animate-blob blur-3xl" />
          <div className="absolute bottom-20 left-10 h-64 w-64 rounded-full bg-orange-600/20 animate-blob delay-300 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur border border-white/20"><span className="text-xl">🔨</span></div>
            <span className="font-extrabold text-2xl text-white"><span className="text-orange-300">حرف</span>تي</span>
          </div>
          <h2 className="text-4xl font-black text-white leading-tight mb-4">
            انضم إلى<br />مجتمع<br />الحرفيين
          </h2>
          <p className="text-white/60 leading-relaxed">المنصة الأولى التي تربط الحرفيين المهرة بأصحاب العمل في كل الجزائر</p>
        </div>

        <div className="relative z-10 space-y-3">
          {BENEFITS.map((b) => (
            <div key={b} className="flex items-center gap-3 glass rounded-xl px-4 py-3">
              <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-white/80 text-sm">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg"><span className="text-xl">🔨</span></div>
              <span className="font-extrabold text-2xl"><span className="text-gradient">حرف</span>تي</span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'login'|'register')}>
            <TabsList className="w-full mb-6 p-1.5 bg-white border border-border shadow-sm">
              <TabsTrigger value="login" className="flex-1 py-2.5">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="register" className="flex-1 py-2.5">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-border/50 shadow-xl shadow-black/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-black">مرحباً بعودتك 👋</CardTitle>
                  <CardDescription>أدخل بياناتك للوصول لحسابك</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>كلمة المرور</Label>
                      <div className="relative">
                        <Input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" variant="premium" className="w-full h-12 text-base" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : null}
                      تسجيل الدخول
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground mt-5">
                    ليس لديك حساب؟{' '}
                    <button onClick={() => setTab('register')} className="text-orange-600 hover:underline font-semibold">أنشئ حساباً</button>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-border/50 shadow-xl shadow-black/5">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-black">إنشاء حساب 🚀</CardTitle>
                  <CardDescription>مجاناً تماماً — لا بطاقة مطلوبة</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRegister} className="space-y-4">
                    {/* Role picker */}
                    <div className="space-y-2">
                      <Label>نوع الحساب</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {([['worker','🔨','حرفي / عامل','اعرض مهاراتك واحصل على عمل'],['employer','🏢','صاحب عمل','انشر وظائف وجد حرفيين']] as const).map(([r, icon, title, desc]) => (
                          <button key={r} type="button" onClick={() => setRole(r)}
                            className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all',
                              role === r ? 'border-orange-500 bg-orange-50/50 shadow-sm shadow-orange-500/10' : 'border-border hover:border-orange-200 bg-white')}>
                            <span className="text-2xl">{icon}</span>
                            <div>
                              <p className={cn('text-sm font-bold', role === r ? 'text-orange-700' : 'text-foreground')}>{title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <Input placeholder="أحمد بن محمد" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input type="email" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>كلمة المرور</Label>
                      <div className="relative">
                        <Input type={showPass ? 'text' : 'password'} placeholder="8 أحرف على الأقل" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" variant="premium" className="w-full h-12 text-base" disabled={loading}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : null}
                      إنشاء حسابي مجاناً
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground mt-5">
                    لديك حساب بالفعل؟{' '}
                    <button onClick={() => setTab('login')} className="text-orange-600 hover:underline font-semibold">سجّل دخولك</button>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
