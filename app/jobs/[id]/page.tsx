'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, ArrowRight, Clock, Send, Loader2, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateAmount, sanitizeText } from '@/lib/validation';

type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data }, { data: w }] = await Promise.all([
        supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('id', id).maybeSingle(),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setJob(data as Job | null);
      setWilayas(w || []);
      setLoading(false);
    })();
  }, [id]);

  const handleContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job) return;
    const te = validateTitle(contractTitle); if (te) { toast.error(te); return; }
    const ae = validateAmount(contractAmount); if (ae) { toast.error(ae); return; }
    setSubmitting(true);
    const { error } = await supabase.from('contracts').insert({
      employer_id: job.employer_id,
      worker_id: user.id,
      job_id: job.id,
      title: sanitizeText(contractTitle),
      amount: parseInt(contractAmount),
      terms: contractTerms ? sanitizeText(contractTerms) : null,
    });
    setSubmitting(false);
    if (error) toast.error('فشل إرسال العرض: ' + error.message);
    else { toast.success('تم إرسال عرضك بنجاح'); setContractOpen(false); setContractTitle(''); setContractAmount(''); setContractTerms(''); }
  };

  const wName = (wid: number | null) => wilayas.find((w) => w.id === wid)?.name || 'الجزائر';

  if (loading) return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  );

  if (!job) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-gray-500 text-lg">الوظيفة غير موجودة</p>
      <Button variant="outline" className="mt-4" onClick={() => router.push('/jobs')}>العودة للوظائف</Button>
    </div>
  );

  const isWorker = profile?.role === 'worker';
  const isOpen = job.status === 'open';
  const isOwnJob = profile?.id === job.employer_id;

  const statusMap: Record<string, { label: string; cls: string }> = {
    open: { label: 'مفتوحة', cls: 'bg-green-100 text-green-700' },
    in_progress: { label: 'قيد التنفيذ', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'منجزة', cls: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'ملغاة', cls: 'bg-red-100 text-red-700' },
  };
  const sc = statusMap[job.status] || statusMap.open;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-gray-600">
        <ArrowRight className="h-4 w-4" /> العودة
      </Button>

      <div className="grid gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <h1 className="text-2xl font-bold">{job.title}</h1>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${sc.cls}`}>{sc.label}</span>
            </div>
            <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{wName(job.wilaya_id)}</span>
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{new Date(job.created_at).toLocaleDateString('ar-DZ')}</span>
              {job.specialty && <Badge variant="outline">{job.specialty}</Badge>}
            </div>
            <div className="mb-5">
              <h3 className="font-semibold mb-2 text-gray-800">وصف الوظيفة</h3>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
            {job.budget && (
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
                <DollarSign className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="font-bold text-orange-700 text-lg">{job.budget.toLocaleString()} دج</p>
                  <p className="text-xs text-orange-500">الميزانية المتاحة</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {job.employer && (
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />صاحب العمل</CardTitle></CardHeader>
            <CardContent className="pt-0">
              <Link href={`/profile/${job.employer.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-orange-100 text-orange-700 font-bold">
                    {job.employer.full_name?.charAt(0) || '؟'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{job.employer.full_name || 'صاحب عمل'}</p>
                  <p className="text-sm text-gray-500">{job.employer.company_name || 'مستقل'}</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {isWorker && isOpen && !isOwnJob && user && (
          <Dialog open={contractOpen} onOpenChange={setContractOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600">
                <Send className="h-4 w-4 ml-2" />
                تقديم عرض للوظيفة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>تقديم عرض عمل</DialogTitle></DialogHeader>
              <form onSubmit={handleContract} className="space-y-4 mt-2">
                <div className="space-y-2"><Label>عنوان العرض *</Label><Input placeholder="مثال: عرض نجارة الخزائن" value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>المبلغ المقترح (دج) *</Label><Input type="number" placeholder="5000" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} required /></div>
                <div className="space-y-2"><Label>شروط ومدة العمل</Label><Textarea placeholder="أي تفاصيل إضافية..." rows={3} value={contractTerms} onChange={(e) => setContractTerms(e.target.value)} /></div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setContractOpen(false)}>إلغاء</Button>
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={submitting}>{submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}إرسال العرض</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {!user && isOpen && (
          <Button size="lg" className="w-full bg-orange-500 hover:bg-orange-600" asChild>
            <Link href="/auth">سجّل دخولك لتقديم عرض</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
