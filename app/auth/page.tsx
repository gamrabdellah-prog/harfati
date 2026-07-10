'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hammer, Building2, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateFullName, sanitizeText } from '@/lib/validation';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(searchParams.get('tab') === 'register' ? 'register' : 'login');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const router = useRouter();
  const { signIn, signUp, user } = useAuth();

  useEffect(() => { if (user) router.push('/'); }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (emailErr) { toast.error(emailErr); return; }
    if (passErr) { toast.error(passErr); return; }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error(error.message.includes('Invalid') ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'فشل تسجيل الدخول: ' + error.message);
    } else {
      toast.success('مرحباً بك!');
      router.push('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateFullName(fullName);
    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    if (nameErr) { toast.error(nameErr); return; }
    if (emailErr) { toast.error(emailErr); return; }
    if (passErr) { toast.error(passErr); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, role, sanitizeText(fullName));
    setLoading(false);
    if (error) {
      toast.error('فشل إنشاء الحساب: ' + error.message);
    } else {
      toast.success('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
      setTab('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-3xl mb-2">
            <Hammer className="h-8 w-8" /><span>حرفتي</span>
          </div>
          <p className="text-muted-foreground">منصة الحرفيين الجزائرية</p>
        </div>
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="login" className="flex-1">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">إنشاء حساب</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader><CardTitle>تسجيل الدخول</CardTitle><CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">البريد الإلكتروني</Label>
                    <Input id="login-email" type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <div className="relative">
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}تسجيل الدخول
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="register">
            <Card>
              <CardHeader><CardTitle>إنشاء حساب جديد</CardTitle><CardDescription>اختر نوع الحساب وأدخل بياناتك</CardDescription></CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('worker')} className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${role === 'worker' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}>
                      <Hammer className="h-6 w-6" /><span className="text-sm font-medium">حرفي / عامل</span>
                    </button>
                    <button type="button" onClick={() => setRole('employer')} className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${role === 'employer' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}>
                      <Building2 className="h-6 w-6" /><span className="text-sm font-medium">صاحب عمل</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="أدخل اسمك الكامل" className="pr-9" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input type="email" placeholder="example@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Input type={showPassword ? 'text' : 'password'} placeholder="8 أحرف على الأقل" value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}إنشاء الحساب
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
