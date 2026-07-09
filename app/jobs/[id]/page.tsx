'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { MapPin, Briefcase, ArrowLeft, Clock, User, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const [job, setJob] = useState<(Tables['jobs'] & { employer: Tables['profiles'] | null }) | null>(null);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractTitle, setContractTitle] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [contractTerms, setContractTerms] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, employer:profiles!jobs_employer_id_fkey(*)')
        .eq('id', id)
        .maybeSingle();
      setJob(data || null);
      const { data: w } = await supabase.from('wilayas').select('*').order('id');
      setWilayas(w || []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile || !job) return;
    setSubmitting(true);
    const { error } = await supabase.from('contracts').insert({
      employer_id: job.employer_id,
      worker_id: user.id,
      job_id: job.id,
      title: contractTitle,
      amount: parseInt(contractAmount),
      terms: contractTerms,
    });
    setSubmitting(false);
    if (error) {
      toast.error('فشل إنشاء العقد: ' + error.message);
    } else {
      toast.success('تم إرسال العرض بنجاح');
      setContractOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="animate-pulse h-96" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">الوظيفة غير موجودة</p>
      </div>
    );
  }

  const isEmployer = profile?.role === 'employer';
  const isOpen = job.status === 'open';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={() => router.push('/jobs')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة للوظائف
        </Button>

        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(job.created_at).toLocaleDateString('ar-DZ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {wilayas.find(w => w.id === job.wilaya_id)?.name || 'الجزائر'}
                  </span>
                </div>
              </div>
              <Badge variant={isOpen ? 'default' : 'secondary'} className="shrink-0">
                {isOpen ? 'مفتوحة' : job.status === 'in_progress' ? 'قيد التنفيذ' : 'مغلقة'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">الوصف</h3>
              <p className="text-muted-foreground leading-relaxed">{job.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {job.budget && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="text-sm text-muted-foreground mb-1">
                    الميزانية
                  </div>
                  <div className="font-bold text-primary-500">{job.budget} دج</div>
                </div>
              )}
              {job.specialty && (
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Briefcase className="w-4 h-4" />
                    التخصص
                  </div>
                  <div className="font-bold">{job.specialty}</div>
                </div>
              )}
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  صاحب العمل
                </div>
                <div className="font-bold">{job.employer?.full_name || 'غير معروف'}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-4 border-t border-border">
              {!isEmployer && isOpen && (
                <Dialog open={contractOpen} onOpenChange={setContractOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                      <Send className="w-4 h-4 mr-2" />
                      تقديم عرض
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>تقديم عرض عمل</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateContract} className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>عنوان العرض</Label>
                        <Input value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>المبلغ المقترح (دج)</Label>
                        <Input type="number" value={contractAmount} onChange={(e) => setContractAmount(e.target.value)} required />
                      </div>
                      <div className="space-y-2">
                        <Label>الشروط والتفاصيل</Label>
                        <Textarea value={contractTerms} onChange={(e) => setContractTerms(e.target.value)} placeholder="اكتب تفاصيل العرض..." />
                      </div>
                      <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال العرض'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              {job.employer_id && (
                <Link href={`/profile/${job.employer_id}`}>
                  <Button variant="outline">
                    <User className="w-4 h-4 mr-2" />
                    عرض الملف الشخصي
                  </Button>
                </Link>
              )}

              {job.employer_id && user && job.employer_id !== user.id && (
                <Link href={`/messages?user=${job.employer_id}`}>
                  <Button variant="outline">
                    <Send className="w-4 h-4 mr-2" />
                    مراسلة
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
