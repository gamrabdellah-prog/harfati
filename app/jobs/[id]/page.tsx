'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowRight, Clock, Send, Loader2, DollarSign, Building2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateAmount, sanitizeText } from '@/lib/validation';
type Job = Tables['jobs'] & { employer: Tables['profiles']|null };

export default function JobDetailPage() {
  const { id } = useParams<{id:string}>();
  const router = useRouter(); const { user, profile } = useAuth();
  const [job, setJob] = useState<Job|null>(null);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [contractOpen, setContractOpen] = useState(false);
  const [cTitle, setCTitle] = useState(''); const [cAmount, setCAmount] = useState(''); const [cTerms, setCTerms] = useState('');
  const [sub, setSub] = useState(false);

  useEffect(()=>{
    if(!id)return;
    (async()=>{
      const [{data},{data:w}]=await Promise.all([supabase.from('jobs').select('*,employer:profiles!jobs_employer_id_fkey(*)').eq('id',id).maybeSingle(),supabase.from('wilayas').select('*').order('id')]);
      setJob(data as Job|null); setWilayas(w||[]); setLoading(false);
    })();
  },[id]);

  const handleContract=async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!user||!job)return;
    const te=validateTitle(cTitle);if(te){toast.error(te);return;}
    const ae=validateAmount(cAmount);if(ae){toast.error(ae);return;}
    setSub(true);
    const {error}=await supabase.from('contracts').insert({employer_id:job.employer_id,worker_id:user.id,job_id:job.id,title:sanitizeText(cTitle),amount:parseInt(cAmount),terms:cTerms?sanitizeText(cTerms):null});
    setSub(false);
    if(error)toast.error(error.message);
    else{toast.success('تم إرسال عرضك بنجاح 🎉');setContractOpen(false);setCTitle('');setCAmount('');setCTerms('');}
  };
  const wName=(wid:number|null)=>wilayas.find(w=>w.id===wid)?.name||'الجزائر';
  if(loading)return<div className="container mx-auto px-4 py-10 max-w-3xl space-y-4"><Skeleton className="h-8 w-3/4"/><Skeleton className="h-4 w-1/2"/><Skeleton className="h-40 w-full"/></div>;
  if(!job)return<div className="container mx-auto px-4 py-24 text-center"><p className="text-muted-foreground mb-4">الوظيفة غير موجودة</p><Button variant="outline" onClick={()=>router.push('/jobs')}>العودة للوظائف</Button></div>;
  const isWorker=profile?.role==='worker';
  const statusMap:Record<string,{label:string;cls:string}>={open:{label:'مفتوحة',cls:'badge-available'},in_progress:{label:'قيد التنفيذ',cls:'bg-blue-50 text-blue-700 border border-blue-200'},completed:{label:'منجزة',cls:'bg-gray-100 text-gray-600 border border-gray-200'},cancelled:{label:'ملغاة',cls:'bg-red-50 text-red-600 border border-red-200'}};
  const sc=statusMap[job.status]||statusMap.open;

  return(
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto px-4 max-w-3xl py-8">
        <Button variant="ghost" onClick={()=>router.back()} className="mb-6 gap-2 text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4"/>العودة
        </Button>
        <div className="space-y-5">
          {/* Main card */}
          <div className="bg-white rounded-2xl border shadow-sm p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-black mb-2">{job.title}</h1>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${sc.cls}`}>{sc.label}</span>
                  {job.specialty&&<Badge variant="outline">{job.specialty}</Badge>}
                </div>
              </div>
              {job.budget&&(
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-6 py-4 text-center">
                  <p className="text-xs text-orange-500 font-medium mb-1 flex items-center gap-1"><DollarSign className="h-3 w-3"/>الميزانية</p>
                  <p className="text-2xl font-black text-orange-600">{job.budget.toLocaleString()}<span className="text-sm font-normal"> دج</span></p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b border-dashed">
              <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-orange-400"/>{wName(job.wilaya_id)}</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4 text-orange-400"/>{new Date(job.created_at).toLocaleDateString('ar-DZ',{day:'numeric',month:'long',year:'numeric'})}</span>
            </div>
            <div>
              <h3 className="font-bold mb-3 text-sm uppercase tracking-wide text-muted-foreground">تفاصيل الوظيفة</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Employer */}
          {job.employer&&(
            <div className="bg-white rounded-2xl border shadow-sm p-6">
              <h3 className="font-bold text-sm uppercase tracking-wide text-muted-foreground mb-4 flex items-center gap-2"><Building2 className="h-4 w-4"/>صاحب العمل</h3>
              <Link href={`/profile/${job.employer.id}`} className="flex items-center gap-3 group">
                <Avatar className="h-12 w-12 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white font-bold">{job.employer.full_name?.charAt(0)||'?'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold group-hover:text-orange-600 transition-colors">{job.employer.full_name||'صاحب عمل'}</p>
                  <p className="text-sm text-muted-foreground">{job.employer.company_name||'مستقل'}</p>
                </div>
              </Link>
            </div>
          )}

          {/* CTA */}
          {isWorker&&job.status==='open'&&profile?.id!==job.employer_id&&user&&(
            <Dialog open={contractOpen} onOpenChange={setContractOpen}>
              <DialogTrigger asChild>
                <Button variant="premium" size="xl" className="w-full gap-2">
                  <Send className="h-5 w-5"/>تقديم عرض لهذه الوظيفة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>تقديم عرض عمل</DialogTitle></DialogHeader>
                <form onSubmit={handleContract} className="space-y-4 mt-2">
                  <div className="space-y-2"><Label>عنوان العرض *</Label><Input placeholder="مثال: أتقن نجارة الخزائن" value={cTitle} onChange={e=>setCTitle(e.target.value)} required/></div>
                  <div className="space-y-2"><Label>المبلغ المقترح (دج) *</Label><Input type="number" placeholder="5000" value={cAmount} onChange={e=>setCAmount(e.target.value)} required/></div>
                  <div className="space-y-2"><Label>شروط ومدة العمل</Label><Textarea placeholder="اذكر المدة الزمنية، مراحل العمل..." rows={3} value={cTerms} onChange={e=>setCTerms(e.target.value)}/></div>
                  <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="outline" onClick={()=>setContractOpen(false)}>إلغاء</Button><Button type="submit" variant="premium" disabled={sub}>{sub&&<Loader2 className="ml-2 h-4 w-4 animate-spin"/>}إرسال العرض</Button></div>
                </form>
              </DialogContent>
            </Dialog>
          )}
          {!user&&job.status==='open'&&<Button variant="premium" size="xl" className="w-full" asChild><Link href="/auth">سجّل دخولك لتقديم عرض</Link></Button>}
          {isWorker&&job.status==='open'&&profile?.id===job.employer_id&&(
            <div className="bg-muted rounded-2xl p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2"><CheckCircle className="h-4 w-4"/>هذه وظيفتك</div>
          )}
        </div>
      </div>
    </div>
  );
}
