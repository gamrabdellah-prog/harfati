'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { ALL_SPECIALTY_LABELS } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Briefcase, Plus, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateDescription, validateAmount, sanitizeText } from '@/lib/validation';

type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

export default function JobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState(''); const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(''); const [wilayaId, setWilayaId] = useState(''); const [specialty, setSpecialty] = useState('');

  const fetchJobs = async () => {
    const [{ data }, { data: w }] = await Promise.all([
      supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status','open').order('created_at',{ascending:false}),
      supabase.from('wilayas').select('*').order('id'),
    ]);
    setJobs((data as Job[])||[]); setWilayas(w||[]); setLoading(false);
  };
  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'employer') { toast.error('يجب أن تكون صاحب عمل لنشر وظيفة'); return; }
    const te = validateTitle(title), de = validateDescription(description), be = budget ? validateAmount(budget) : null;
    if (te) { toast.error(te); return; } if (de) { toast.error(de); return; } if (be) { toast.error(be); return; }
    setSubmitting(true);
    const { error } = await supabase.from('jobs').insert({ employer_id: user.id, title: sanitizeText(title), description: sanitizeText(description), budget: budget ? parseInt(budget) : null, wilaya_id: wilayaId ? parseInt(wilayaId) : null, specialty: specialty || null });
    setSubmitting(false);
    if (error) { toast.error('فشل إنشاء الوظيفة: ' + error.message); }
    else { toast.success('تم نشر الوظيفة بنجاح'); setOpen(false); setTitle(''); setDescription(''); setBudget(''); setWilayaId(''); setSpecialty(''); fetchJobs(); }
  };

  const wName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-2xl md:text-3xl font-bold mb-1">الوظائف</h1><p className="text-muted-foreground">اكتشف فرص العمل أو انشر وظيفة جديدة</p></div>
        {profile?.role === 'employer' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="flex items-center gap-2"><Plus className="h-4 w-4" />نشر وظيفة</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>نشر وظيفة جديدة</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2"><Label>عنوان الوظيفة *</Label><Input placeholder="مثال: نجار لتركيب خزائن" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>الوصف *</Label><Textarea placeholder="اشرح العمل المطلوب..." rows={4} value={description} onChange={e => setDescription(e.target.value)} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>الميزانية (دج)</Label><Input type="number" placeholder="5000" value={budget} onChange={e => setBudget(e.target.value)} /></div>
                  <div className="space-y-2"><Label>الولاية</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={wilayaId} onChange={e => setWilayaId(e.target.value)}>
                      <option value="">اختر الولاية</option>{wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2"><Label>التخصص</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none" value={specialty} onChange={e => setSpecialty(e.target.value)}>
                    <option value="">اختر التخصص</option>{ALL_SPECIALTY_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}نشر الوظيفة</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Array.from({length:6}).map((_,i) => <div key={i} className="rounded-xl border p-5 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /></div>)}</div>
      : jobs.length === 0 ? <div className="text-center py-20 text-muted-foreground"><Briefcase className="h-12 w-12 mx-auto mb-3 opacity-30" /><p className="text-lg">لا توجد وظائف متاحة حالياً</p></div>
      : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {jobs.map(job => (
          <Link key={job.id} href={`/jobs/${job.id}`}>
            <Card className="card-hover h-full cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="font-semibold">{job.title}</h3>
                  {job.budget && <span className="text-primary font-bold text-sm shrink-0">{job.budget.toLocaleString()} دج</span>}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" />{wName(job.wilaya_id)}</Badge>
                  {job.specialty && <Badge variant="secondary" className="text-xs">{job.specialty}</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /><span>{new Date(job.created_at).toLocaleDateString('ar-DZ')}</span>
                  {job.employer && <span className="mr-auto">{job.employer.full_name||'صاحب عمل'}</span>}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>}
    </div>
  );
}
