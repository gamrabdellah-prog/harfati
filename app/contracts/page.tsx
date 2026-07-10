'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileText, CheckCircle, XCircle, Clock, Star } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/validation';

type Contract = Tables['contracts'] & {
  employer: Tables['profiles'] | null;
  worker: Tables['profiles'] | null;
};

const STATUS_MAP: Record<string, { label: string; cls: string; icon: React.ElementType }> = {
  pending:   { label: 'قيد الانتظار', cls: 'bg-amber-100 text-amber-700',  icon: Clock },
  accepted:  { label: 'مقبول',         cls: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  rejected:  { label: 'مرفوض',         cls: 'bg-red-100 text-red-700',      icon: XCircle },
  completed: { label: 'منجز',           cls: 'bg-green-100 text-green-700',  icon: CheckCircle },
  cancelled: { label: 'ملغى',           cls: 'bg-gray-100 text-gray-600',    icon: XCircle },
};

export default function ContractsPage() {
  const { user, profile, loading: al } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);

  const fetchContracts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('contracts')
      .select('*, employer:profiles!contracts_employer_id_fkey(*), worker:profiles!contracts_worker_id_fkey(*)')
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    setContracts((data as Contract[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchContracts(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', id);
    if (error) toast.error('فشل التحديث');
    else { toast.success('تم تحديث حالة العقد'); fetchContracts(); }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewId) return;
    const c = contracts.find((x) => x.id === reviewId);
    if (!c) return;
    setSubmitting(true);
    const reviewedId = c.employer_id === user.id ? c.worker_id : c.employer_id;
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      contract_id: c.id,
      rating,
      comment: comment ? sanitizeText(comment) : null,
    });
    setSubmitting(false);
    if (error) toast.error('فشل إرسال التقييم');
    else { toast.success('تم إرسال التقييم بنجاح'); setReviewId(null); setRating(5); setComment(''); }
  };

  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!user) return null;

  const isEmployer = profile?.role === 'employer';
  const pending = contracts.filter((c) => c.status === 'pending');
  const active = contracts.filter((c) => c.status === 'accepted');
  const completed = contracts.filter((c) => c.status === 'completed');

  const ContractCard = ({ c }: { c: Contract }) => {
    const other = c.employer_id === user.id ? c.worker : c.employer;
    const cfg = STATUS_MAP[c.status] || STATUS_MAP.pending;
    const Icon = cfg.icon;
    return (
      <Card className="mb-4 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h3 className="font-semibold">{c.title}</h3>
              <span className="text-orange-600 font-bold">{c.amount.toLocaleString()} دج</span>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${cfg.cls}`}>
              <Icon className="h-3 w-3" />{cfg.label}
            </span>
          </div>
          {other && (
            <Link href={`/profile/${other.id}`} className="flex items-center gap-2 mb-3 hover:opacity-80">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-xs bg-orange-100 text-orange-700 font-bold">{other.full_name?.charAt(0) || '؟'}</AvatarFallback></Avatar>
              <span className="text-sm text-gray-600">{other.full_name || 'مستخدم'}</span>
            </Link>
          )}
          {c.terms && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{c.terms}</p>}
          <p className="text-xs text-gray-400 mb-3">{new Date(c.created_at).toLocaleDateString('ar-DZ')}</p>
          <div className="flex flex-wrap gap-2">
            {c.status === 'pending' && isEmployer && (
              <>
                <Button size="sm" className="bg-green-500 hover:bg-green-600" onClick={() => updateStatus(c.id, 'accepted')}>قبول</Button>
                <Button size="sm" variant="destructive" onClick={() => updateStatus(c.id, 'rejected')}>رفض</Button>
              </>
            )}
            {c.status === 'accepted' && (
              <Button size="sm" variant="outline" onClick={() => updateStatus(c.id, 'completed')}>
                <CheckCircle className="h-3.5 w-3.5 ml-1.5" />تمييز كمنجز
              </Button>
            )}
            {c.status === 'completed' && (
              <Button size="sm" variant="outline" onClick={() => setReviewId(c.id)}>
                <Star className="h-3.5 w-3.5 ml-1.5" />إضافة تقييم
              </Button>
            )}
            {(c.status === 'pending' || c.status === 'accepted') && (
              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-red-500" onClick={() => updateStatus(c.id, 'cancelled')}>إلغاء</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">العقود</h1>
      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد عقود بعد</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">الكل ({contracts.length})</TabsTrigger>
            <TabsTrigger value="pending">انتظار ({pending.length})</TabsTrigger>
            <TabsTrigger value="active">نشط ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">منجز ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{contracts.map((c) => <ContractCard key={c.id} c={c} />)}</TabsContent>
          <TabsContent value="pending">{pending.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد عقود في الانتظار</p> : pending.map((c) => <ContractCard key={c.id} c={c} />)}</TabsContent>
          <TabsContent value="active">{active.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد عقود نشطة</p> : active.map((c) => <ContractCard key={c.id} c={c} />)}</TabsContent>
          <TabsContent value="completed">{completed.length === 0 ? <p className="text-center text-gray-400 py-8">لا توجد عقود منجزة</p> : completed.map((c) => <ContractCard key={c.id} c={c} />)}</TabsContent>
        </Tabs>
      )}

      <Dialog open={!!reviewId} onOpenChange={(o) => !o && setReviewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إضافة تقييم</DialogTitle></DialogHeader>
          <form onSubmit={handleReview} className="space-y-4 mt-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">التقييم</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)}
                    className={`h-9 w-9 rounded-lg border-2 font-bold text-sm transition-colors ${n <= rating ? 'bg-amber-400 border-amber-400 text-white' : 'border-gray-200 hover:border-amber-300'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">تعليق (اختياري)</p>
              <Textarea placeholder="أضف تعليقك..." value={comment} onChange={(e) => setComment(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setReviewId(null)}>إلغاء</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={submitting}>{submitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}إرسال التقييم</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
