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
import { MapPin, Briefcase, Plus, Loader2, Clock, DollarSign, Building2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, sanitizeText } from '@/lib/utils';
import { cn, formatNumber } from '@/lib/utils';

type Job = Tables['jobs'] & { employer: Tables['profiles'] | null };

export default function JobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [budget, setBudget] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [spec, setSpec] = useState('');

  const fetchJobs = async () => {
    const [{ data }, { data: w }] = await Promise.all([
      supabase.from('jobs').select('*, employer:profiles!jobs_employer_id_fkey(*)').eq('status', 'open').order('created_at', { ascending: false }),
      supabase.from('wilayas').select('*').order('id'),
    ]);
    setJobs((data as Job[]) || []); setWilayas(w || []); setLoading(false);
  };
  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profile?.role !== 'employer') { toast.error('صاحب العمل فقط يمكنه نشر وظائف'); return; }
    const te = validateTitle(title); if (te) { toast.error(te); return; }
    if (!desc.trim() || desc.trim().length < 10) { toast.error('الوصف مطلوب (10 أحرف على الأقل)'); return; }
    setSub(true);
    const { error } = await supabase.from('jobs').insert({
      employer_id: user.id,
      title: sanitizeText(title),
      description: sanitizeText(desc),
      budget: budget ? parseInt(budget) : null,
      wilaya_id: wilayaId ? parseInt(wilayaId) : null,
      specialty: spec || null,
    });
    setSub(false);
    if (error) toast.error(error.message);
    else { toast.success('🎉 تم نشر الوظيفة بنجاح!'); setOpen(false); setTitle(''); setDesc(''); setBudget(''); setWilayaId(''); setSpec(''); fetchJobs(); }
  };

  const wName = (id: number | null) => wilayas.find(w => w.id === id)?.name || 'الجزائر';

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Page header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <span className="section-tag mb-4">فرص العمل</span>
              <h1 className="text-4xl font-black mt-3 mb-2">الوظائف المتاحة</h1>
              <p className="text-muted-foreground">اكتشف فرص العمل في مختلف التخصصات والولايات</p>
            </div>
            {profile?.role === 'employer' && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="premium" size="lg" className="gap-2 rounded-2xl shrink-0">
                    <Plus className="h-5 w-5" />نشر وظيفة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>نشر وظيفة جديدة</DialogTitle></DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-5 mt-2">
                    <div><Label>عنوان الوظيفة *</Label><Input placeholder="مثال: نجار لتركيب خزائن المطبخ" value={title} onChange={e => setTitle(e.target.value)} required /></div>
                    <div><Label>الوصف التفصيلي *</Label><Textarea placeholder="اشرح تفاصيل العمل المطلوب، المواصفات، والمتطلبات..." rows={5} value={desc} onChange={e => setDesc(e.target.value)} required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>الميزانية (دج)</Label>
                        <Input type="number" placeholder="10000" value={budget} onChange={e => setBudget(e.target.value)} />
                      </div>
                      <div>
                        <Label>الولاية</Label>
                        <select className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm focus:outline-none focus:border-orange-400" value={wilayaId} onChange={e => setWilayaId(e.target.value)}>
                          <option value="">اختر الولاية</option>
                          {wilayas.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <Label>التخصص المطلوب</Label>
                      <select className="h-12 w-full rounded-2xl border border-border bg-white px-4 text-sm focus:outline-none focus:border-orange-400" value={spec} onChange={e => setSpec(e.target.value)}>
                        <option value="">اختر التخصص</option>
                        {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                      <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setOpen(false)}>إلغاء</Button>
                      <Button type="submit" variant="premium" className="rounded-2xl gap-2" disabled={sub}>
                        {sub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        نشر الوظيفة
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-3xl bg-white border p-6 space-y-4"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-16 w-full" /><Skeleton className="h-4 w-1/2" /></div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-28 text-muted-foreground">
            <Briefcase className="h-20 w-20 mx-auto mb-5 opacity-10" />
            <h3 className="text-2xl font-black mb-3">لا توجد وظائف حالياً</h3>
            <p className="text-muted-foreground mb-8">ارجع لاحقاً لاكتشاف فرص جديدة</p>
            {profile?.role === 'employer' && <Button variant="premium" onClick={() => setOpen(true)} className="gap-2 rounded-2xl"><Plus className="h-4 w-4" />انشر أول وظيفة</Button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map(j => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="group block h-full">
                <div className="card-premium rounded-3xl p-6 h-full flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base leading-snug group-hover:text-orange-600 transition-colors">{j.title}</h3>
                    {j.budget && (
                      <div className="shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl px-3 py-2 text-center">
                        <p className="text-[10px] text-orange-500 font-medium">الميزانية</p>
                        <p className="font-black text-orange-700 text-sm">{formatNumber(j.budget)} دج</p>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed flex-1">{j.description}</p>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-dashed border-border/60">
                    <Badge variant="secondary" className="text-xs gap-1 rounded-full"><MapPin className="h-3 w-3" />{wName(j.wilaya_id)}</Badge>
                    {j.specialty && <Badge variant="orange" className="text-xs rounded-full">{j.specialty}</Badge>}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(j.created_at).toLocaleDateString('ar-DZ', { day: 'numeric', month: 'short' })}</span>
                    {j.employer && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{j.employer.full_name || 'صاحب عمل'}</span>}
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
