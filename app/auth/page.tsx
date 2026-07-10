'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateEmail, validatePassword, validateFullName, sanitizeText } from '@/lib/validation';

export default function AuthPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );
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
    if (emailErr) { toast.error(emailErr); return; }
    const passErr = validatePassword(password);
    if (passErr) { toast.error(passErr); return; }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes('Invalid') || error.message.includes('credentials')
          ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
          : 'فشل تسجيل الدخول: ' + error.message
      );
    } else {
      toast.success('مرحباً بك!');
      router.push('/');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameErr = validateFullName(fullName);
    if (nameErr) { toast.error(nameErr); return; }
    const emailErr = validateEmail(email);
    if (emailErr) { toast.error(emailErr); return; }
    const passErr = validatePassword(password);
    if (passErr) { toast.error(passErr); return; }
    setLoading(true);
    const { error } = await signUp(email.trim(), password, role, sanitizeText(fullName));
    setLoading(false);
    if (error) {
      toast.error('فشل إنشاء الحساب: ' + error.message);
    } else {
      toast.success('تم إنشاء الحساب بنجاح!');
      setTab('login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔨</div>
          <h1 className="text-2xl font-bold text-gray-900">حرفتي</h1>
          <p className="text-gray-500 mt-1">منصة الحرفيين الجزائرية</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'login' | 'register')}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="login" className="flex-1">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="register" className="flex-1">إنشاء حساب</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>تسجيل الدخول</CardTitle>
                <CardDescription>أدخل بياناتك للوصول إلى حسابك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    تسجيل الدخول
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>إنشاء حساب جديد</CardTitle>
                <CardDescription>اختر نوع حسابك وأدخل بياناتك</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('worker')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        role === 'worker'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <span className="text-2xl">🔨</span>
                      <span className="text-sm font-medium">حرفي / عامل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('employer')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                        role === 'employer'
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-orange-200'
                      }`}
                    >
                      <span className="text-2xl">🏢</span>
                      <span className="text-sm font-medium">صاحب عمل</span>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم الكامل</Label>
                    <Input
                      placeholder="أدخل اسمك الكامل"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>البريد الإلكتروني</Label>
                    <Input
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="8 أحرف على الأقل"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={loading}
                  >
                    {loading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                    إنشاء الحساب
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
