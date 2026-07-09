'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTY_CATEGORIES, ALL_SPECIALTY_LABELS } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { validateFullName, sanitizeText } from '@/lib/validation';
import {
  User, MapPin, Phone, Calendar, Award, Briefcase, Building2,
  Save, Loader2, FileText, Star, MessageSquare, ClipboardList,
  Bell, Eye, EyeOff
} from 'lucide-react';

export default function DashboardPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [saving, setSaving] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [contracts, setContracts] = useState<Tables['contracts'][]>([]);
  const [myJobs, setMyJobs] = useState<Tables['jobs'][]>([]);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    bio: '',
    wilaya_id: '',
    address: '',
    specialty: '',
    hourly_rate: '',
    years_experience: '',
    company_name: '',
    facebook_url: '',
    instagram_url: '',
    linkedin_url: '',
    availability: 'available' as 'available' | 'busy' | 'unavailable',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        wilaya_id: profile.wilaya_id?.toString() || '',
        address: profile.address || '',
        specialty: profile.specialty || '',
        hourly_rate: profile.hourly_rate?.toString() || '',
        years_experience: profile.years_experience?.toString() || '',
        company_name: profile.company_name || '',
        facebook_url: profile.facebook_url || '',
        instagram_url: profile.instagram_url || '',
        linkedin_url: profile.linkedin_url || '',
        availability: profile.availability || 'available',
      });
    }
  }, [profile]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: w } = await supabase.from('wilayas').select('*').order('id');
      setWilayas(w || []);

      if (user) {
        const { count: msgCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('is_read', false);
        setUnreadMessages(msgCount || 0);

        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        setUnreadNotifications(notifCount || 0);

        const { data: c } = await supabase
          .from('contracts')
          .select('*')
          .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(5);
        setContracts(c || []);

        const { data: j } = await supabase
          .from('jobs')
          .select('*')
          .eq('employer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setMyJobs(j || []);
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const nameErr = form.full_name ? validateFullName(form.full_name) : null;
    if (nameErr) { toast.error(nameErr); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name ? sanitizeText(form.full_name) : null,
      phone: form.phone ? sanitizeText(form.phone) : null,
      bio: form.bio ? sanitizeText(form.bio) : null,
      wilaya_id: form.wilaya_id ? parseInt(form.wilaya_id, 10) : null,
      address: form.address ? sanitizeText(form.address) : null,
      specialty: form.specialty || null,
      hourly_rate: form.hourly_rate ? parseInt(form.hourly_rate, 10) : null,
      years_experience: form.years_experience ? parseInt(form.years_experience, 10) : null,
      company_name: form.company_name ? sanitizeText(form.company_name) : null,
      facebook_url: form.facebook_url ? sanitizeText(form.facebook_url) : null,
      instagram_url: form.instagram_url ? sanitizeText(form.instagram_url) : null,
      linkedin_url: form.linkedin_url ? sanitizeText(form.linkedin_url) : null,
      availability: form.availability,
    }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast.error('فشل الحفظ: ' + error.message);
    } else {
      toast.success('تم حفظ التغييرات بنجاح');
      refreshProfile();
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user || !profile) return null;

  const isWorker = profile.role === 'worker';
  const specialties = [...ALL_SPECIALTY_LABELS, 'عام'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-4 border-primary-100">
              <AvatarFallback className="bg-primary-100 text-primary-600 text-2xl font-bold">
                {profile.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">لوحة التحكم</h1>
              <p className="text-muted-foreground">{profile.full_name || user.email} — {isWorker ? 'حرفي' : 'صاحب عمل'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="w-4 h-4" />
              <span>{unreadMessages}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span>{unreadNotifications}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{profile.avg_rating}</div>
                <div className="text-xs text-muted-foreground">متوسط التقييم</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{contracts.length}</div>
                <div className="text-xs text-muted-foreground">عقود</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{myJobs.length}</div>
                <div className="text-xs text-muted-foreground">وظائف</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary-500" />
              </div>
              <div>
                <div className="text-xl font-bold">{unreadMessages}</div>
                <div className="text-xs text-muted-foreground">رسائل جديدة</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-4">
            <TabsTrigger value="profile">الملف الشخصي</TabsTrigger>
            <TabsTrigger value="contracts">العقود ({contracts.length})</TabsTrigger>
            {isWorker && <TabsTrigger value="jobs">الوظائف ({myJobs.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleSave}>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg">تعديل الملف الشخصي</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>الاسم الكامل</Label>
                      <div className="relative">
                        <User className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <Input className="pr-10" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>الولاية</Label>
                      <div className="relative">
                        <MapPin className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                        <select className="w-full h-10 rounded-md border border-input bg-transparent px-10 py-2 text-sm outline-none" value={form.wilaya_id} onChange={(e) => setForm({ ...form, wilaya_id: e.target.value })}>
                          <option value="">اختر الولاية</option>
                          {wilayas.map((w) => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>العنوان</Label>
                      <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                    </div>
                    {isWorker && (
                      <>
                        <div className="space-y-2">
                          <Label>التخصص</Label>
                          <div className="relative">
                            <Briefcase className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <select className="w-full h-10 rounded-md border border-input bg-transparent px-10 py-2 text-sm outline-none" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })}>
                              <option value="">اختر التخصص</option>
                              {SPECIALTY_CATEGORIES.map((cat) => (
                                <optgroup key={cat.name} label={cat.name}>
                                  {cat.specialties.map((s) => (
                                    <option key={s.label} value={s.label}>{s.label}</option>
                                  ))}
                                </optgroup>
                              ))}
                              <option value="عام">عام</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>الأجر بالساعة (دج)</Label>
                          <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                          <Label>سنوات الخبرة</Label>
                          <div className="relative">
                            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                            <Input className="pr-10" type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>الحالة</Label>
                          <select className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value as 'available' | 'busy' | 'unavailable' })}>
                            <option value="available">متاح</option>
                            <option value="busy">مشغول</option>
                            <option value="unavailable">غير متاح</option>
                          </select>
                        </div>
                      </>
                    )}
                    {!isWorker && (
                      <div className="space-y-2">
                        <Label>اسم الشركة / المؤسسة</Label>
                        <div className="relative">
                          <Building2 className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" />
                          <Input className="pr-10" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>نبذة عنك</Label>
                    <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="اكتب نبذة قصيرة عنك ومهاراتك..." />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>فيسبوك</Label>
                      <Input value={form.facebook_url} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="رابط الفيسبوك" />
                    </div>
                    <div className="space-y-2">
                      <Label>إنستغرام</Label>
                      <Input value={form.instagram_url} onChange={(e) => setForm({ ...form, instagram_url: e.target.value })} placeholder="رابط الإنستغرام" />
                    </div>
                    <div className="space-y-2">
                      <Label>لينكدإن</Label>
                      <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} placeholder="رابط لينكدإن" />
                    </div>
                  </div>

                  <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white" disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    حفظ التغييرات
                  </Button>
                </CardContent>
              </Card>
            </form>
          </TabsContent>

          <TabsContent value="contracts">
            <div className="space-y-4">
              {contracts.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد عقود</p>
                  </CardContent>
                </Card>
              ) : (
                contracts.map((c) => (
                  <Card key={c.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold">{c.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{c.amount} دج</p>
                        </div>
                        <Badge variant={c.status === 'pending' ? 'secondary' : c.status === 'accepted' ? 'default' : c.status === 'completed' ? 'outline' : 'destructive'}>
                          {c.status === 'pending' ? 'قيد الانتظار' : c.status === 'accepted' ? 'مقبول' : c.status === 'completed' ? 'منجز' : 'ملغى'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {isWorker && (
            <TabsContent value="jobs">
              <div className="space-y-4">
                {myJobs.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center text-muted-foreground">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>لم تنشر أي وظائف</p>
                    </CardContent>
                  </Card>
                ) : (
                  myJobs.map((j) => (
                    <Card key={j.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold">{j.title}</h3>
                            <p className="text-sm text-muted-foreground mt-1">{j.description}</p>
                          </div>
                          <Badge variant={j.status === 'open' ? 'default' : 'secondary'}>
                            {j.status === 'open' ? 'مفتوحة' : 'مغلقة'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
