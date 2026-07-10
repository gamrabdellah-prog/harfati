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
import { MapPin, ArrowRight, Clock, Send, Loader2, DollarSign, Building2, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateAmount, sanitizeText, formatNumber, formatDate } from '@/lib/utils';

type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  open: { label: 'مفتوحة', cls: 'badge-open' },
  in_progress: { label: 'قيد التنفيذ', cls: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold' },
  completed: { label: 'منجزة', cls: 'bg-gray-100 text-gray-600 border border-gray-200 font-semibold' },
  cancelled: { label: 'ملغاة', cls: 'bg-red-50 text-red-600 border border-red-200 font-semibold' },
};

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [contractOpen, setContractOpen] = useState(false);
  const [cTitle, setCTitle] = useState('');
  const [cAmount, setCAmount] = useState('');
  const [cTerms, setCTerms] = useState('');
  const [sub, setSub] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data }, { data: w }] = await Promise.all([
        supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('id', id).maybeSingle(),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setJob(data as Job | null); setWilayas(w || []); setLoading(false);
    })();
  }, [id]);

  const handleContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    const te = validateTitle(cTitle); if (te) { toast.error(te); return; }
    const ae = validateAmount(cAmount); if (ae) { toast.error(ae); return; }
    setSub(true);
    const { error } = await supabase.from('contracts').insert({
      employer_id: job.employer_id, worker_id: user.id, job_id: job.id,
      title: sanitizeText(cTitle), amount: parseInt(cAmount), terms: cTerms ? sanitizeText(cTerms) : null,
    });
    setSub(false);
    if (error) toast.error(error.message);
    else { toast.success('🎉 تم إرسال عرضك بنجاح!'); setContractOpen(false); setCTitle(''); setCAmount(''); setCTerms(''); }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <Skeleton className="h-8 w-2/3" /><Skeleton className="h-5 w-1/2" /><Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
  if (!job) return (
    <div className="max-w-3xl mx-auto px-4 py-28 text-center">
      <p className="text-2xl font-black mb-3">الوظيفة غير موجودة</p>
      <Button variant="orange-outline" className="rounded-2xl mt-4" onClick={() => router.push('/jobs')}>العودة للوظائف</Button>
    </div>
  );

  const wName = (wid: number | null) => wilayas.find(w => w.id === wid)?.name || 'الجزائر';
  const sc = STATUS_MAP[job.status] || STATUS_MAP.open;
  const isWorker = profile?.role === 'worker';
  const isOwner = profile?.id === job.employer_id;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 text-muted-foreground hover:text-foreground rounded-2xl -mr-2">
          <ArrowRight className="h-4 w-4" />العودة
        </Button>

        {/* Main card */}
        <div className="bg-white rounded-3xl border shadow-card p-8">
          <div className="flex flex-wrap items-start justify-between gap-5 mb-7">
            <div className="flex-1">
              <h1 className="text-2xl font-black mb-3">{job.title}</h1>
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs px-3 py-1.5 rounded-full ${sc.cls}`}>{sc.label}</span>
                {job.specialty && <Badge variant="orange" className="rounded-full">{job.specialty}</Badge>}
              </div>
            </div>
            {job.budget && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-3xl px-8 py-5 text-center shadow-glow-sm">
                <p className="text-xs text-orange-500 font-semibold mb-1 flex items-center justify-center gap-1"><DollarSign className="h-3 w-3" />الميزانية</p>
                <p className="text-3xl font-black text-orange-700">{formatNumber(job.budget)}</p>
                <p className="text-xs text-orange-500 mt-0.5">دينار جزائري</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-muted-foreground mb-7 pb-7 border-b border-dashed">
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-orange-400" />{wName(job.wilaya_id)}</span>
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-orange-400" />{formatDate(job.created_at)}</span>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">تفاصيل الوظيفة</h3>
            <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>
        </div>

        {/* Employer */}
        {job.employer && (
          <div className="bg-white rounded-3xl border shadow-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-orange-400" />صاحب العمل
            </h3>
            <Link href={`/profile/${job.employer.id}`} className="flex items-center gap-4 group">
              <Avatar className="h-14 w-14 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black text-xl">
                  {job.employer.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-bold text-base group-hover:text-orange-600 transition-colors">{job.employer.full_name || 'صاحب عمل'}</p>
                <p className="text-sm text-muted-foreground">{job.employer.company_name || 'مستقل'}</p>
              </div>
            </Link>
          </div>
        )}

        {/* CTA */}
        {isWorker && job.status === 'open' && !isOwner && user && (
          <Dialog open={contractOpen} onOpenChange={setContractOpen}>
            <DialogTrigger asChild>
              <Button variant="premium" size="xl" className="w-full rounded-3xl gap-3 shadow-glow">
                <Send className="h-5 w-5" />تقديم عرض لهذه الوظيفة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>تقديم عرض عمل</DialogTitle></DialogHeader>
              <form onSubmit={handleContract} className="space-y-5 mt-2">
                <div><Label>عنوان العرض *</Label><Input placeholder="مثال: متخصص في نجارة الخزائن" value={cTitle} onChange={e => setCTitle(e.target.value)} required /></div>
                <div><Label>المبلغ المقترح (دج) *</Label><Input type="number" placeholder="8000" value={cAmount} onChange={e => setCAmount(e.target.value)} required /></div>
                <div><Label>الشروط والمدة</Label><Textarea placeholder="اذكر المدة المتوقعة، مراحل العمل، وأي ملاحظات..." rows={4} value={cTerms} onChange={e => setCTerms(e.target.value)} /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setContractOpen(false)}>إلغاء</Button>
                  <Button type="submit" variant="premium" className="rounded-2xl gap-2" disabled={sub}>
                    {sub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}إرسال العرض
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
        {!user && job.status === 'open' && (
          <Button variant="premium" size="xl" className="w-full rounded-3xl" asChild>
            <Link href="/auth">سجّل دخولك لتقديم عرض</Link>
          </Button>
        )}
        {isOwner && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-center text-sm text-orange-700 flex items-center justify-center gap-2 font-medium">
            <CheckCircle className="h-4 w-4" />هذه وظيفتك
          </div>
        )}
      </div>
    </div>
  );
}
