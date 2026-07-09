'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { SPECIALTY_CATEGORIES, ALL_SPECIALTY_LABELS } from '@/lib/specialties';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Briefcase, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { validateTitle, validateDescription, validateAmount, sanitizeText } from '@/lib/validation';

export default function JobsPage() {
  const { user, profile } = useAuth();
  const [jobs, setJobs] = useState<(Tables['jobs'] & { employer: Tables['profiles'] | null })[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [wilayaId, setWilayaId] = useState('');
  const [specialty, setSpecialty] = useState('');

  const specialties = [...ALL_SPECIALTY_LABELS, 'عام'];

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_employer_id_fkey(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setJobs(data || []);
      const { data: w } = await supabase.from('wilayas').select('*').order('id');
      setWilayas(w || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || profile.role !== 'employer') {
      toast.error('يجب أن تكون صاحب عمل لنشر وظيفة');
      return;
    }
    const titleErr = validateTitle(title);
    const descErr = validateDescription(description);
    const budgetErr = budget ? validateAmount(budget) : null;
    if (titleErr) { toast.error(titleErr); return; }
    if (descErr) { toast.error(descErr); return; }
    if (budgetErr) { toast.error(budgetErr); return; }
    setSubmitting(true);
    const { error } = await supabase.from('jobs').insert({
      employer_id: user.id,
      title: sanitizeText(title),
      description: sanitizeText(description),
      budget: budget ? parseInt(budget, 10) : null,
      wilaya_id: wilayaId ? parseInt(wilayaId, 10) : null,
      specialty: specialty || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error('فشل إنشاء الوظيفة: ' + error.message);
    } else {
      toast.success('تم نشر الوظيفة بنجاح');
      setDialogOpen(false);
      setTitle('');
      setDescription('');
      setBudget('');
      setWilayaId('');
      setSpecialty('');
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_employer_id_fkey(*)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      setJobs(data || []);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">الوظائف</h1>
            <p className="text-muted-foreground">اكتشف فرص العمل أو انشر وظيفة جديدة</p>
          </div>
          {profile?.role === 'employer' && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  نشر وظيفة
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>نشر وظيفة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: نجار مطلوب للأثاث" required />
                  </div>
                  <div className="space-y-2">
                    <Label>الوصف</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="وصف التفاصيل والمتطلبات..." required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>الميزانية (دج)</Label>
                      <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="اختياري" />
                    </div>
                    <div className="space-y-2">
                      <Label>الولاية</Label>
                      <select className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={wilayaId} onChange={(e) => setWilayaId(e.target.value)}>
                        <option value="">اختياري</option>
                        {wilayas.map((w) => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>التخصص المطلوب</Label>
                    <select className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                      <option value="">اختياري</option>
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
                  <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'نشر الوظيفة'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobs.length === 0 ? (
              <div className="col-span-2 text-center py-12 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد وظائف متاحة حالياً</p>
              </div>
            ) : (
              jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <Card className="h-full hover:shadow-md transition-shadow border-border/60 cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground mb-1">{job.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {wilayas.find(w => w.id === job.wilaya_id)?.name || 'الجزائر'}
                            </span>
                            {job.budget && (
                              <span className="font-medium text-primary-500">{job.budget} دج</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            صاحب العمل: {job.employer?.full_name || 'غير معروف'}
                          </p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">{job.specialty || 'عام'}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
