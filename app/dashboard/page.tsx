'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTIES } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { validateFullName, sanitizeText } from '@/lib/utils';
import { Save, Loader2, FileText, Star, MessageSquare, Bell, User, Briefcase, Plus, X, Settings } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  const { user, profile, loading: al, refreshProfile } = useAuth();
  const router = useRouter();
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [saving, setSaving] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [contracts, setContracts] = useState<Tables['contracts'][]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    full_name: '', phone: '', bio: '', wilaya_id: '', address: '',
    specialty: '', hourly_rate: '', years_experience: '', company_name: '',
    facebook_url: '', instagram_url: '', linkedin_url: '',
    availability: 'available' as 'available' | 'busy' | 'unavailable',
    skills: [] as string[],
  });

  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);

  useEffect(() => {
    if (profile) setForm({
      full_name: profile.full_name || '', phone: profile.phone || '', bio: profile.bio || '',
      wilaya_id: profile.wilaya_id?.toString() || '', address: profile.address || '',
      specialty: profile.specialty || '', hourly_rate: profile.hourly_rate?.toString() || '',
      years_experience: profile.years_experience?.toString() || '', company_name: profile.company_name || '',
      facebook_url: profile.facebook_url || '', instagram_url: profile.instagram_url || '',
      linkedin_url: profile.linkedin_url || '', availability: profile.availability || 'available',
      skills: profile.skills || [],
    });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: w }, { count: m }, { count: n }, { data: c }] = await Promise.all([
        supabase.from('wilayas').select('*').order('id'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('contracts').select('*').or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(5),
      ]);
      setWilayas(w || []); setUnreadMsg(m || 0); setUnreadNotif(n || 0); setContracts(c || []);
    })();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.full_name) { const ne = validateFullName(form.full_name); if (ne) { toast.error(ne); return; } }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name ? sanitizeText(form.full_name) : null,
      phone: form.phone ? sanitizeText(form.phone) : null,
      bio: form.bio ? sanitizeText(form.bio) : null,
      wilaya_id: form.wilaya_id ? parseInt(form.wilaya_id) : null,
      address: form.address ? sanitizeText(form.address) : null,
      specialty: form.specialty || null,
      hourly_rate: form.hourly_rate ? parseInt(form.hourly_rate) : null,
      years_experience: form.years_experience ? parseInt(form.years_experience) : null,
      company_name: form.company_name ? sanitizeText(form.company_name) : null,
      facebook_url: form.facebook_url ? sanitizeText(form.facebook_url) : null,
      instagram_url: form.instagram_url ? sanitizeText(form.instagram_url) : null,
      linkedin_url: form.linkedin_url ? sanitizeText(form.linkedin_url) : null,
      availability: form.availability, skills: form.skills,
    }).eq('id', user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success('✅ تم حفظ التغييرات بنجاح'); refreshProfile(); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) { setForm(p => ({ ...p, skills: [...p.skills, s] })); setSkillInput(''); }
  };

  const SelectField = ({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: React.ReactNode }) => (
    <div>
      <Label>{label}</Label>
      <select
        className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm focus:outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/12 transition-all"
        value={value} onChange={e => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );

  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!user || !profile) return null;

  const isWorker = profile.role === 'worker';

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Premium header banner */}
      <div className="relative bg-hero noise overflow-hidden">
        <div className="absolute inset-0 pattern-hero" />
        <div className="absolute -right-20 top-0 bottom-0 w-80 bg-orange-500/8 blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 py-10">
          <div className="flex flex-wrap items-center gap-5">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-4 ring-white/20 shadow-dark-lg">
                <AvatarFallback className="bg-white/15 text-white font-black text-3xl backdrop-blur">
                  {profile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-[#0d0705]" />
            </div>
            <div className="flex-1">
              <p className="text-white/40 text-sm font-medium">{isWorker ? '🔨 حرفي / عامل' : '🏢 صاحب عمل'}</p>
              <h1 className="text-2xl font-black text-white mt-0.5">{profile.full_name || user.email}</h1>
              {profile.specialty && <p className="text-orange-300/70 text-sm mt-1">{profile.specialty}</p>}
            </div>
            <div className="flex gap-2">
              <Link href="/messages">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/15 gap-2 rounded-2xl backdrop-blur" size="sm">
                  <MessageSquare className="h-4 w-4" />الرسائل
                  {unreadMsg > 0 && <Badge className="bg-orange-500 text-white text-[10px] rounded-full px-1.5">{unreadMsg}</Badge>}
                </Button>
              </Link>
              <Link href="/notifications">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/15 gap-2 rounded-2xl backdrop-blur" size="sm">
                  <Bell className="h-4 w-4" />الإشعارات
                  {unreadNotif > 0 && <Badge className="bg-orange-500 text-white text-[10px] rounded-full px-1.5">{unreadNotif}</Badge>}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-4xl mx-auto px-4 -mt-5 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Star, label: 'التقييم', value: profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '—', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50' },
            { icon: FileText, label: 'العقود', value: contracts.length, color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-50' },
            { icon: MessageSquare, label: 'رسائل', value: unreadMsg, color: 'from-orange-400 to-orange-600', bg: 'bg-orange-50' },
            { icon: Bell, label: 'إشعارات', value: unreadNotif, color: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border shadow-card p-5 flex items-center gap-3">
              <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-sm', s.color)}>
                <s.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-black tabular-nums">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        <Tabs defaultValue="profile">
          <TabsList className="mb-8">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />الملف الشخصي</TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2"><FileText className="h-4 w-4" />العقود ({contracts.length})</TabsTrigger>
            <TabsTrigger value="settings" className="gap-2"><Settings className="h-4 w-4" />الإعدادات</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleSave} className="space-y-5">
              {/* Basic info */}
              <div className="bg-white rounded-3xl border shadow-card p-7 space-y-5">
                <h2 className="font-black text-lg flex items-center gap-2"><User className="h-5 w-5 text-orange-500" />المعلومات الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="اسمك الكامل" /></div>
                  <div><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="05xxxxxxxx" type="tel" /></div>
                  <SelectField label="الولاية" value={form.wilaya_id} onChange={v => setForm({ ...form, wilaya_id: v })}>
                    <option value="">اختر الولاية</option>
                    {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </SelectField>
                  <div><Label>العنوان التفصيلي</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="الحي، المدينة، الولاية" /></div>
                </div>
                <div><Label>نبذة عنك</Label><Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="اكتب نبذة مختصرة عن خبراتك ومؤهلاتك..." rows={4} /></div>
              </div>

              {/* Professional info */}
              {isWorker && (
                <div className="bg-white rounded-3xl border shadow-card p-7 space-y-5">
                  <h2 className="font-black text-lg flex items-center gap-2"><Briefcase className="h-5 w-5 text-orange-500" />المعلومات المهنية</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <SelectField label="التخصص" value={form.specialty} onChange={v => setForm({ ...form, specialty: v })}>
                      <option value="">اختر التخصص</option>
                      {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </SelectField>
                    <div><Label>الأجر بالساعة (دج)</Label><Input type="number" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: e.target.value })} placeholder="1500" /></div>
                    <div><Label>سنوات الخبرة</Label><Input type="number" value={form.years_experience} onChange={e => setForm({ ...form, years_experience: e.target.value })} placeholder="5" /></div>
                  </div>

                  <div>
                    <Label>الحالة الحالية</Label>
                    <div className="flex gap-3 flex-wrap">
                      {([['available', '✅ متاح الآن'], ['busy', '🔶 مشغول'], ['unavailable', '❌ غير متاح']] as const).map(([a, label]) => (
                        <button key={a} type="button" onClick={() => setForm({ ...form, availability: a })}
                          className={cn('px-5 py-3 rounded-2xl border-2 text-sm font-bold transition-all',
                            form.availability === a ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-glow-sm' : 'border-border hover:border-orange-300 bg-white')}>
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>المهارات والكفاءات</Label>
                    <div className="flex gap-3 mb-3">
                      <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="اكتب مهارة ثم اضغط Enter أو أضف" />
                      <Button type="button" variant="outline" onClick={addSkill} className="shrink-0 rounded-2xl gap-2"><Plus className="h-4 w-4" />أضف</Button>
                    </div>
                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {form.skills.map(s => (
                          <span key={s} className="flex items-center gap-2 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-100 px-4 py-2 rounded-2xl text-sm font-semibold">
                            {s}
                            <button type="button" onClick={() => setForm(p => ({ ...p, skills: p.skills.filter(x => x !== s) }))}
                              className="text-orange-400 hover:text-red-500 transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isWorker && (
                <div className="bg-white rounded-3xl border shadow-card p-7">
                  <h2 className="font-black text-lg flex items-center gap-2 mb-5"><Briefcase className="h-5 w-5 text-orange-500" />معلومات المؤسسة</h2>
                  <div><Label>اسم الشركة / المؤسسة</Label><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="اسم شركتك أو مؤسستك" /></div>
                </div>
              )}

              {/* Social links */}
              <div className="bg-white rounded-3xl border shadow-card p-7 space-y-4">
                <h2 className="font-black text-lg">روابط التواصل الاجتماعي</h2>
                {[['facebook_url', '📘 فيسبوك', 'https://facebook.com/...'], ['instagram_url', '📸 إنستغرام', 'https://instagram.com/...'], ['linkedin_url', '💼 لينكدإن', 'https://linkedin.com/in/...']] .map(([key, label, ph]) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} placeholder={ph} type="url" />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="premium" size="xl" disabled={saving} className="gap-3 rounded-2xl shadow-glow">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="contracts">
            {contracts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground bg-white rounded-3xl border shadow-card">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-black mb-2">لا توجد عقود بعد</h3>
                <Button variant="orange-outline" size="sm" className="mt-4 rounded-2xl" asChild><Link href="/contracts">عرض جميع العقود</Link></Button>
              </div>
            ) : (
              <div className="space-y-3">
                {contracts.map(c => (
                  <Link key={c.id} href="/contracts">
                    <div className="bg-white rounded-3xl border shadow-card hover:shadow-card-hover transition-all p-6 flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(c.created_at).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-black text-orange-600 text-lg">{formatNumber(c.amount)} <span className="text-xs font-normal text-muted-foreground">دج</span></span>
                        <Badge variant="outline" className="text-xs rounded-full">{c.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button variant="orange-outline" className="w-full rounded-2xl mt-2" asChild><Link href="/contracts">عرض جميع العقود</Link></Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-white rounded-3xl border shadow-card p-7 text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-10 text-muted-foreground" />
              <h3 className="text-xl font-black mb-2">الإعدادات</h3>
              <p className="text-muted-foreground text-sm">سيتم إضافة إعدادات متقدمة قريباً</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
