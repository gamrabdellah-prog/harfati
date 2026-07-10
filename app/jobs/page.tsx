'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTIES } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Briefcase, Plus, Loader2, CalendarDays, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateDescription, validateAmount, sanitizeText } from '@/lib/validation';
type Job = Tables['jobs'] & { employer: Tables['profiles']|null };

export default function JobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(false);
  const [title, setTitle] = useState(''); const [desc, setDesc] = useState(''); const [budget, setBudget] = useState(''); const [wilayaId, setWilayaId] = useState(''); const [spec, setSpec] = useState('');

  const fetchJobs = async () => {
    const [{ data }, { data: w }] = await Promise.all([supabase.from('jobs').select('*,employer:profiles!jobs_employer_id_fkey(*)').eq('status','open').order('created_at',{ascending:false}), supabase.from('wilayas').select('*').order('id')]);
    setJobs((data as Job[])||[]); setWilayas(w||[]); setLoading(false);
  };
  useEffect(()=>{fetchJobs();},[]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user||profile?.role!=='employer'){toast.error('صاحب العمل فقط يمكنه نشر وظائف');return;}
    const te=validateTitle(title);if(te){toast.error(te);return;}
    const de=validateDescription(desc);if(de){toast.error(de);return;}
    if(budget){const be=validateAmount(budget);if(be){toast.error(be);return;}}
    setSub(true);
    const {error}=await supabase.from('jobs').insert({employer_id:user.id,title:sanitizeText(title),description:sanitizeText(desc),budget:budget?parseInt(budget):null,wilaya_id:wilayaId?parseInt(wilayaId):null,specialty:spec||null});
    setSub(false);
    if(error)toast.error(error.message);
    else{toast.success('تم نشر الوظيفة!');setOpen(false);setTitle('');setDesc('');setBudget('');setWilayaId('');setSpec('');fetchJobs();}
  };
  const wName=(id:number|null)=>wilayas.find(w=>w.id===id)?.name||'الجزائر';

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 max-w-6xl py-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black mb-1">الوظائف المتاحة</h1>
              <p className="text-muted-foreground">اكتشف فرص العمل في مختلف التخصصات</p>
            </div>
            {profile?.role==='employer'&&(
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium" className="gap-2 shrink-0"><Plus className="h-4 w-4"/>نشر وظيفة</Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>نشر وظيفة جديدة</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 mt-2">
                    <div className="space-y-2"><Label>عنوان الوظيفة *</Label><Input placeholder="مثال: نجار لتركيب خزائن" value={title} onChange={e=>setTitle(e.target.value)} required/></div>
                    <div className="space-y-2"><Label>الوصف *</Label><Textarea placeholder="اشرح تفاصيل العمل..." rows={4} value={desc} onChange={e=>setDesc(e.target.value)} required/></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>الميزانية (دج)</Label><Input type="number" placeholder="5000" value={budget} onChange={e=>setBudget(e.target.value)}/></div>
                      <div className="space-y-2"><Label>الولاية</Label><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none" value={wilayaId} onChange={e=>setWilayaId(e.target.value)}><option value="">اختر</option>{wilayas.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                    </div>
                    <div className="space-y-2"><Label>التخصص</Label><select className="h-11 w-full rounded-xl border border-input bg-white px-3 text-sm focus:outline-none" value={spec} onChange={e=>setSpec(e.target.value)}><option value="">اختر التخصص</option>{SPECIALTIES.map(s=><option key={s} value={s}>{s}</option>)}</select></div>
                    <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={()=>setOpen(false)}>إلغاء</Button><Button type="submit" variant="premium" disabled={sub}>{sub&&<Loader2 className="ml-2 h-4 w-4 animate-spin"/>}نشر</Button></div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl py-8">
        {loading?(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{Array.from({length:6}).map((_,i)=><div key={i} className="rounded-2xl bg-white border p-6 space-y-3"><Skeleton className="h-5 w-3/4"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-1/2"/></div>)}</div>
        ):jobs.length===0?(
          <div className="text-center py-24 text-muted-foreground"><Briefcase className="h-16 w-16 mx-auto mb-4 opacity-20"/><h3 className="text-xl font-bold mb-2">لا توجد وظائف حالياً</h3><p className="text-sm">ارجع لاحقاً لاكتشاف فرص جديدة</p></div>
        ):(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map(j=>(
              <Link key={j.id} href={`/jobs/${j.id}`} className="group">
                <div className="card-premium card-glow rounded-2xl p-6 h-full bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-bold text-base group-hover:text-orange-600 transition-colors">{j.title}</h3>
                    {j.budget&&<span className="shrink-0 flex items-center gap-1 text-orange-600 font-black bg-orange-50 px-3 py-1 rounded-xl text-sm border border-orange-100"><DollarSign className="h-3 w-3"/>{j.budget.toLocaleString()}</span>}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">{j.description}</p>
                  <div className="flex flex-wrap gap-2 items-center pt-3 border-t border-dashed">
                    <Badge variant="secondary" className="text-xs gap-1"><MapPin className="h-3 w-3"/>{wName(j.wilaya_id)}</Badge>
                    {j.specialty&&<Badge variant="outline" className="text-xs">{j.specialty}</Badge>}
                    <span className="mr-auto flex items-center gap-1 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3"/>{new Date(j.created_at).toLocaleDateString('ar-DZ')}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
