'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation'; import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase'; import type { Tables } from '@/lib/supabase';
import { ALL_SPECIALTY_LABELS } from '@/lib/specialties';
import { Button } from '@/components/ui/button'; import { Input } from '@/components/ui/input'; import { Textarea } from '@/components/ui/textarea'; import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar'; import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner'; import { validateFullName, sanitizeText } from '@/lib/validation';
import { User, Save, Loader2, FileText, Star, MessageSquare, Briefcase, Bell } from 'lucide-react';
export default function DashboardPage() {
  const { user, profile, loading: al, refreshProfile } = useAuth(); const router = useRouter();
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [saving, setSaving] = useState(false); const [unreadMsg, setUnreadMsg] = useState(0); const [unreadNotif, setUnreadNotif] = useState(0);
  const [contracts, setContracts] = useState<Tables['contracts'][]>([]); const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({ full_name:'', phone:'', bio:'', wilaya_id:'', address:'', specialty:'', hourly_rate:'', years_experience:'', company_name:'', facebook_url:'', instagram_url:'', linkedin_url:'', availability:'available' as 'available'|'busy'|'unavailable', skills:[] as string[] });
  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);
  useEffect(() => { if (profile) setForm({ full_name:profile.full_name||'', phone:profile.phone||'', bio:profile.bio||'', wilaya_id:profile.wilaya_id?.toString()||'', address:profile.address||'', specialty:profile.specialty||'', hourly_rate:profile.hourly_rate?.toString()||'', years_experience:profile.years_experience?.toString()||'', company_name:profile.company_name||'', facebook_url:profile.facebook_url||'', instagram_url:profile.instagram_url||'', linkedin_url:profile.linkedin_url||'', availability:profile.availability||'available', skills:profile.skills||[] }); }, [profile]);
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: w }, { count: m }, { count: n }, { data: c }] = await Promise.all([
        supabase.from('wilayas').select('*').order('id'),
        supabase.from('messages').select('*',{count:'exact',head:true}).eq('receiver_id',user.id).eq('is_read',false),
        supabase.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false),
        supabase.from('contracts').select('*').or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(5),
      ]);
      setWilayas(w||[]); setUnreadMsg(m||0); setUnreadNotif(n||0); setContracts(c||[]);
    })();
  }, [user]);
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    const ne = form.full_name ? validateFullName(form.full_name) : null; if (ne) { toast.error(ne); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name:form.full_name?sanitizeText(form.full_name):null, phone:form.phone?sanitizeText(form.phone):null, bio:form.bio?sanitizeText(form.bio):null, wilaya_id:form.wilaya_id?parseInt(form.wilaya_id):null, address:form.address?sanitizeText(form.address):null, specialty:form.specialty||null, hourly_rate:form.hourly_rate?parseInt(form.hourly_rate):null, years_experience:form.years_experience?parseInt(form.years_experience):null, company_name:form.company_name?sanitizeText(form.company_name):null, facebook_url:form.facebook_url?sanitizeText(form.facebook_url):null, instagram_url:form.instagram_url?sanitizeText(form.instagram_url):null, linkedin_url:form.linkedin_url?sanitizeText(form.linkedin_url):null, availability:form.availability, skills:form.skills }).eq('id',user.id);
    setSaving(false);
    if (error) toast.error('فشل الحفظ: ' + error.message);
    else { toast.success('تم حفظ التغييرات بنجاح'); refreshProfile(); }
  };
  const addSkill = () => { const s = skillInput.trim(); if (s && !form.skills.includes(s)) { setForm(p => ({...p,skills:[...p.skills,s]})); setSkillInput(''); } };
  const removeSkill = (s: string) => setForm(p => ({...p,skills:p.skills.filter(x=>x!==s)}));
  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user || !profile) return null;
  const isWorker = profile.role==='worker';
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-white font-bold text-xl">{profile.full_name?.charAt(0)||user.email?.charAt(0)?.toUpperCase()||'؟'}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0"><h1 className="text-xl font-bold">لوحة التحكم</h1><p className="text-muted-foreground text-sm">{profile.full_name||user.email} — {isWorker?'حرفي':'صاحب عمل'}</p></div>
        <div className="flex gap-2">
          <Link href="/messages"><Button variant="outline" size="sm"><MessageSquare className="h-4 w-4 ml-1.5" />الرسائل{unreadMsg>0&&<Badge className="mr-1.5 text-xs">{unreadMsg}</Badge>}</Button></Link>
          <Link href="/notifications"><Button variant="outline" size="sm"><Bell className="h-4 w-4 ml-1.5" />الإشعارات{unreadNotif>0&&<Badge className="mr-1.5 text-xs">{unreadNotif}</Badge>}</Button></Link>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{icon:Star,label:'متوسط التقييم',value:profile.avg_rating?.toFixed(1)||'0.0',color:'text-amber-500'},{icon:FileText,label:'العقود',value:contracts.length,color:'text-blue-500'},{icon:MessageSquare,label:'رسائل جديدة',value:unreadMsg,color:'text-primary'},{icon:Bell,label:'إشعارات جديدة',value:unreadNotif,color:'text-green-500'}].map(s => (
          <Card key={s.label}><CardContent className="p-4 flex items-center gap-3"><s.icon className={`h-8 w-8 ${s.color}`} /><div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div></CardContent></Card>
        ))}
      </div>
      <Tabs defaultValue="profile">
        <TabsList className="mb-6">
          <TabsTrigger value="profile"><User className="h-4 w-4 ml-1.5" />الملف الشخصي</TabsTrigger>
          <TabsTrigger value="contracts"><FileText className="h-4 w-4 ml-1.5" />العقود ({contracts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <form onSubmit={handleSave} className="space-y-6">
            <Card><CardHeader><CardTitle className="text-base">المعلومات الأساسية</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={e => setForm({...form,full_name:e.target.value})} placeholder="أدخل اسمك الكامل" /></div>
                <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e => setForm({...form,phone:e.target.value})} placeholder="05xxxxxxxx" type="tel" /></div>
                <div className="space-y-2"><Label>الولاية</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={form.wilaya_id} onChange={e => setForm({...form,wilaya_id:e.target.value})}>
                    <option value="">اختر الولاية</option>{wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({...form,address:e.target.value})} placeholder="الحي، المدينة" /></div>
              </div>
              <div className="space-y-2"><Label>نبذة عنك</Label><Textarea value={form.bio} onChange={e => setForm({...form,bio:e.target.value})} placeholder="اكتب نبذة مختصرة عن خبراتك..." rows={3} /></div>
            </CardContent></Card>
            {isWorker && <Card><CardHeader><CardTitle className="text-base">معلومات مهنية</CardTitle></CardHeader><CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2"><Label>التخصص</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={form.specialty} onChange={e => setForm({...form,specialty:e.target.value})}>
                    <option value="">اختر التخصص</option>{ALL_SPECIALTY_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2"><Label>الأجر بالساعة (دج)</Label><Input type="number" value={form.hourly_rate} onChange={e => setForm({...form,hourly_rate:e.target.value})} placeholder="1500" /></div>
                <div className="space-y-2"><Label>سنوات الخبرة</Label><Input type="number" value={form.years_experience} onChange={e => setForm({...form,years_experience:e.target.value})} placeholder="5" /></div>
              </div>
              <div className="space-y-2"><Label>الحالة</Label>
                <div className="flex gap-3">{(['available','busy','unavailable'] as const).map(a => (
                  <button key={a} type="button" onClick={() => setForm({...form,availability:a})} className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${form.availability===a?'border-primary bg-primary/5 text-primary':'border-border hover:border-primary/50'}`}>
                    {a==='available'?'متاح':a==='busy'?'مشغول':'غير متاح'}
                  </button>
                ))}</div>
              </div>
              <div className="space-y-2"><Label>المهارات</Label>
                <div className="flex gap-2"><Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key==='Enter'&&(e.preventDefault(),addSkill())} placeholder="أضف مهارة واضغط Enter" /><Button type="button" variant="outline" onClick={addSkill}>إضافة</Button></div>
                {form.skills.length>0&&<div className="flex flex-wrap gap-2 mt-2">{form.skills.map(s => <span key={s} className="flex items-center gap-1 bg-muted px-3 py-1 rounded-full text-sm">{s}<button type="button" onClick={() => removeSkill(s)} className="text-muted-foreground hover:text-foreground ml-1">×</button></span>)}</div>}
              </div>
            </CardContent></Card>}
            {!isWorker && <Card><CardHeader><CardTitle className="text-base">معلومات المؤسسة</CardTitle></CardHeader><CardContent>
              <div className="space-y-2"><Label>اسم الشركة / المؤسسة</Label><Input value={form.company_name} onChange={e => setForm({...form,company_name:e.target.value})} placeholder="اسم الشركة" /></div>
            </CardContent></Card>}
            <Card><CardHeader><CardTitle className="text-base">روابط التواصل الاجتماعي</CardTitle></CardHeader><CardContent className="space-y-3">
              <div className="space-y-2"><Label>فيسبوك</Label><Input value={form.facebook_url} onChange={e => setForm({...form,facebook_url:e.target.value})} placeholder="https://facebook.com/..." type="url" /></div>
              <div className="space-y-2"><Label>إنستغرام</Label><Input value={form.instagram_url} onChange={e => setForm({...form,instagram_url:e.target.value})} placeholder="https://instagram.com/..." type="url" /></div>
              <div className="space-y-2"><Label>لينكدإن</Label><Input value={form.linkedin_url} onChange={e => setForm({...form,linkedin_url:e.target.value})} placeholder="https://linkedin.com/in/..." type="url" /></div>
            </CardContent></Card>
            <div className="flex justify-end"><Button type="submit" disabled={saving} size="lg">{saving?<Loader2 className="h-4 w-4 animate-spin ml-2" />:<Save className="h-4 w-4 ml-2" />}حفظ التغييرات</Button></div>
          </form>
        </TabsContent>
        <TabsContent value="contracts">
          {contracts.length===0?<div className="text-center py-12 text-muted-foreground"><FileText className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>لا توجد عقود بعد</p><Button variant="outline" size="sm" className="mt-4" asChild><Link href="/contracts">عرض جميع العقود</Link></Button></div>
          :<div className="space-y-3">{contracts.map(c => <Link key={c.id} href="/contracts"><Card className="hover:bg-muted/30 cursor-pointer"><CardContent className="p-4 flex items-center justify-between gap-3"><div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('ar-DZ')}</p></div><div className="flex items-center gap-2"><span className="text-primary font-bold text-sm">{c.amount.toLocaleString()} دج</span><Badge variant="outline" className="text-xs">{c.status}</Badge></div></CardContent></Card></Link>)}<Button variant="outline" className="w-full mt-2" asChild><Link href="/contracts">عرض جميع العقود</Link></Button></div>}
        </TabsContent>
      </Tabs>
    </div>
  );
}
