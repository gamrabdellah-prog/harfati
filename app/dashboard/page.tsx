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
import { validateFullName, sanitizeText } from '@/lib/validation';
import { Save, Loader2, FileText, Star, MessageSquare, Bell, User, Briefcase, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, profile, loading:al, refreshProfile } = useAuth(); const router = useRouter();
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [saving, setSaving] = useState(false);
  const [unreadMsg, setUnreadMsg] = useState(0); const [unreadNotif, setUnreadNotif] = useState(0);
  const [contracts, setContracts] = useState<Tables['contracts'][]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({full_name:'',phone:'',bio:'',wilaya_id:'',address:'',specialty:'',hourly_rate:'',years_experience:'',company_name:'',facebook_url:'',instagram_url:'',linkedin_url:'',availability:'available' as 'available'|'busy'|'unavailable',skills:[] as string[]});

  useEffect(()=>{if(!al&&!user)router.push('/auth');},[al,user,router]);
  useEffect(()=>{if(profile)setForm({full_name:profile.full_name||'',phone:profile.phone||'',bio:profile.bio||'',wilaya_id:profile.wilaya_id?.toString()||'',address:profile.address||'',specialty:profile.specialty||'',hourly_rate:profile.hourly_rate?.toString()||'',years_experience:profile.years_experience?.toString()||'',company_name:profile.company_name||'',facebook_url:profile.facebook_url||'',instagram_url:profile.instagram_url||'',linkedin_url:profile.linkedin_url||'',availability:profile.availability||'available',skills:profile.skills||[]});},[profile]);
  useEffect(()=>{
    if(!user)return;
    (async()=>{
      const [{data:w},{count:m},{count:n},{data:c}]=await Promise.all([supabase.from('wilayas').select('*').order('id'),supabase.from('messages').select('*',{count:'exact',head:true}).eq('receiver_id',user.id).eq('is_read',false),supabase.from('notifications').select('*',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false),supabase.from('contracts').select('*').or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at',{ascending:false}).limit(5)]);
      setWilayas(w||[]); setUnreadMsg(m||0); setUnreadNotif(n||0); setContracts(c||[]);
    })();
  },[user]);

  const handleSave=async(e:React.FormEvent)=>{
    e.preventDefault(); if(!user)return;
    if(form.full_name){const ne=validateFullName(form.full_name);if(ne){toast.error(ne);return;}}
    setSaving(true);
    const {error}=await supabase.from('profiles').update({full_name:form.full_name?sanitizeText(form.full_name):null,phone:form.phone?sanitizeText(form.phone):null,bio:form.bio?sanitizeText(form.bio):null,wilaya_id:form.wilaya_id?parseInt(form.wilaya_id):null,address:form.address?sanitizeText(form.address):null,specialty:form.specialty||null,hourly_rate:form.hourly_rate?parseInt(form.hourly_rate):null,years_experience:form.years_experience?parseInt(form.years_experience):null,company_name:form.company_name?sanitizeText(form.company_name):null,facebook_url:form.facebook_url?sanitizeText(form.facebook_url):null,instagram_url:form.instagram_url?sanitizeText(form.instagram_url):null,linkedin_url:form.linkedin_url?sanitizeText(form.linkedin_url):null,availability:form.availability,skills:form.skills}).eq('id',user.id);
    setSaving(false);
    if(error)toast.error(error.message);
    else{toast.success('تم حفظ التغييرات ✅');refreshProfile();}
  };
  const addSkill=()=>{const s=skillInput.trim();if(s&&!form.skills.includes(s)){setForm(p=>({...p,skills:[...p.skills,s]}));setSkillInput('');}};
  if(al)return<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500"/></div>;
  if(!user||!profile)return null;
  const isWorker=profile.role==='worker';

  return(
    <div className="min-h-screen bg-muted/20">
      {/* Top banner */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-700 text-white">
        <div className="container mx-auto px-4 max-w-4xl py-8">
          <div className="flex flex-wrap items-center gap-4">
            <Avatar className="h-16 w-16 ring-4 ring-white/30 shadow-xl">
              <AvatarFallback className="bg-white/20 text-white font-black text-2xl">{profile.full_name?.charAt(0)||user.email?.charAt(0)?.toUpperCase()||'?'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-white/60 text-sm">{isWorker?'👷 حرفي / عامل':'🏢 صاحب عمل'}</p>
              <h1 className="text-2xl font-black">{profile.full_name||user.email}</h1>
            </div>
            <div className="flex gap-2">
              <Link href="/messages"><Button className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5 backdrop-blur" size="sm"><MessageSquare className="h-4 w-4"/>رسائل{unreadMsg>0&&<Badge className="bg-white text-orange-600 mr-1 text-xs">{unreadMsg}</Badge>}</Button></Link>
              <Link href="/notifications"><Button className="bg-white/15 hover:bg-white/25 text-white border-0 gap-1.5 backdrop-blur" size="sm"><Bell className="h-4 w-4"/>إشعارات{unreadNotif>0&&<Badge className="bg-white text-orange-600 mr-1 text-xs">{unreadNotif}</Badge>}</Button></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto px-4 max-w-4xl -mt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[{icon:Star,label:'التقييم',value:profile.avg_rating>0?profile.avg_rating.toFixed(1):'—',color:'text-amber-500',bg:'bg-amber-50'},{icon:FileText,label:'العقود',value:contracts.length,color:'text-blue-500',bg:'bg-blue-50'},{icon:MessageSquare,label:'رسائل',value:unreadMsg,color:'text-orange-500',bg:'bg-orange-50'},{icon:Bell,label:'إشعارات',value:unreadNotif,color:'text-emerald-500',bg:'bg-emerald-50'}].map(s=>(
            <div key={s.label} className="bg-white rounded-2xl border shadow-sm p-5 flex items-center gap-3">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center',s.bg)}><s.icon className={cn('h-5 w-5',s.color)}/></div>
              <div><p className="text-xl font-black">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4"/>الملف الشخصي</TabsTrigger>
            <TabsTrigger value="contracts" className="gap-2"><FileText className="h-4 w-4"/>العقود ({contracts.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <form onSubmit={handleSave} className="space-y-5">
              <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                <h2 className="font-bold text-base flex items-center gap-2"><User className="h-4 w-4 text-orange-500"/>المعلومات الأساسية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="اسمك الكامل"/></div>
                  <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="05xxxxxxxx" type="tel"/></div>
                  <div className="space-y-2"><Label>الولاية</Label><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.wilaya_id} onChange={e=>setForm({...form,wilaya_id:e.target.value})}><option value="">اختر الولاية</option>{wilayas.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                  <div className="space-y-2"><Label>العنوان</Label><Input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="الحي، المدينة"/></div>
                </div>
                <div className="space-y-2"><Label>نبذة عنك</Label><Textarea value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} placeholder="اكتب نبذة مختصرة..." rows={3}/></div>
              </div>

              {isWorker&&(
                <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-5">
                  <h2 className="font-bold text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-orange-500"/>المعلومات المهنية</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>التخصص</Label><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" value={form.specialty} onChange={e=>setForm({...form,specialty:e.target.value})}><option value="">اختر</option>{SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="space-y-2"><Label>الأجر/ساعة (دج)</Label><Input type="number" value={form.hourly_rate} onChange={e=>setForm({...form,hourly_rate:e.target.value})} placeholder="1500"/></div>
                    <div className="space-y-2"><Label>سنوات الخبرة</Label><Input type="number" value={form.years_experience} onChange={e=>setForm({...form,years_experience:e.target.value})} placeholder="5"/></div>
                  </div>
                  <div className="space-y-3">
                    <Label>الحالة</Label>
                    <div className="flex gap-2">
                      {(['available','busy','unavailable'] as const).map(a=>(
                        <button key={a} type="button" onClick={()=>setForm({...form,availability:a})}
                          className={cn('px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all',
                            form.availability===a?'border-orange-500 bg-orange-50 text-orange-700 shadow-sm':'border-border hover:border-orange-200')}>
                          {a==='available'?'✅ متاح':a==='busy'?'🔶 مشغول':'❌ غير متاح'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>المهارات</Label>
                    <div className="flex gap-2">
                      <Input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill();}}} placeholder="أضف مهارة واضغط Enter"/>
                      <Button type="button" variant="outline" onClick={addSkill} size="icon"><Plus className="h-4 w-4"/></Button>
                    </div>
                    {form.skills.length>0&&(
                      <div className="flex flex-wrap gap-2">
                        {form.skills.map(s=>(
                          <span key={s} className="flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 px-3 py-1.5 rounded-xl text-sm font-medium">
                            {s}<button type="button" onClick={()=>setForm(p=>({...p,skills:p.skills.filter(x=>x!==s)}))} className="text-orange-400 hover:text-red-500 transition-colors"><X className="h-3 w-3"/></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isWorker&&(
                <div className="bg-white rounded-2xl border shadow-sm p-6">
                  <h2 className="font-bold text-base flex items-center gap-2 mb-5"><Briefcase className="h-4 w-4 text-orange-500"/>معلومات المؤسسة</h2>
                  <div className="space-y-2"><Label>اسم الشركة</Label><Input value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} placeholder="اسم الشركة أو المؤسسة"/></div>
                </div>
              )}

              <div className="bg-white rounded-2xl border shadow-sm p-6 space-y-4">
                <h2 className="font-bold text-base">روابط التواصل الاجتماعي</h2>
                {[['facebook_url','فيسبوك','https://facebook.com/...'],['instagram_url','إنستغرام','https://instagram.com/...'],['linkedin_url','لينكدإن','https://linkedin.com/in/...']].map(([key,label,ph])=>(
                  <div key={key} className="space-y-2"><Label>{label}</Label><Input value={(form as any)[key]} onChange={e=>setForm({...form,[key]:e.target.value})} placeholder={ph} type="url"/></div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" variant="premium" size="lg" disabled={saving} className="gap-2">
                  {saving?<Loader2 className="h-5 w-5 animate-spin"/>:<Save className="h-5 w-5"/>}
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="contracts">
            {contracts.length===0?(
              <div className="text-center py-16 text-muted-foreground bg-white rounded-2xl border shadow-sm"><FileText className="h-12 w-12 mx-auto mb-3 opacity-20"/><p className="font-medium">لا توجد عقود بعد</p><Button variant="outline" size="sm" className="mt-4" asChild><Link href="/contracts">عرض الكل</Link></Button></div>
            ):(
              <div className="space-y-3">
                {contracts.map(c=>(
                  <Link key={c.id} href="/contracts">
                    <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-5 flex items-center justify-between gap-3">
                      <div><p className="font-bold">{c.title}</p><p className="text-xs text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString('ar-DZ')}</p></div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-orange-600">{c.amount.toLocaleString()} دج</span>
                        <Badge variant="outline" className="text-xs">{c.status}</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
                <Button variant="outline" className="w-full" asChild><Link href="/contracts">عرض جميع العقود</Link></Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
