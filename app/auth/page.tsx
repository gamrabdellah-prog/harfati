'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hammer, Building2, User, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateFullName, sanitizeText } from '@/lib/validation';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const router = useRouter();
  const { signIn, signUp } = useAuth();

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
      toast.error('فشل تسجيل الدخول: ' + error.message);
    } else {
      toast.success('تم تسجيل الدخول بنجاح');
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
      toast.success('تم إنشاء الحساب بنجاح، يمكنك الآن تسجيل الدخول');
      setTab('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 geometric-pattern">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Hammer className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">حرفتي</h1>
          <p className="text-muted-foreground">منصة الحرفيين الجزائرية</p>
        </div>

        <Card className="border-border/60 shadow-lg">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 rounded-none border-b border-border bg-transparent p-0 h-12">
              <TabsTrigger
                value="login"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium"
              >
                تسجيل الدخول
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none text-sm font-medium"
              >
                إنشاء حساب
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="m-0">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
                <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="example@email.com"
                        className="pr-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pr-10 pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تسجيل الدخول'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="register" className="m-0">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl">إنشاء حساب جديد</CardTitle>
                <CardDescription>اختر نوع الحساب وأدخل بياناتك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label>نوع الحساب</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole('worker')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          role === 'worker'
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-border bg-card text-muted-foreground hover:border-primary-300'
                        }`}
                      >
                        <Hammer className="w-6 h-6" />
                        <span className="text-sm font-medium">حرفي / موظف</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          role === 'employer'
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-border bg-card text-muted-foreground hover:border-primary-300'
                        }`}
                      >
                        <Building2 className="w-6 h-6" />
                        <span className="text-sm font-medium">صاحب عمل</span>
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-name">الاسم الكامل</Label>
                    <div className="relative">
                      <User className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-name"
                        placeholder="الاسم واللقب"
                        className="pr-10"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-email"
                        type="email"
                        placeholder="example@email.com"
                        className="pr-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">كلمة المرور</Label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="8 أحرف على الأقل"
                        className="pr-10 pl-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-2.5 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إنشاء الحساب'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
