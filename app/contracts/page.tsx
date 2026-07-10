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
import { Loader2, FileText, Clock, CheckCircle, XCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { validateComment, sanitizeText } from '@/lib/validation';

type Contract = Tables['contracts'] & {
  employer: Tables['profiles'] | null;
  worker: Tables['profiles'] | null;
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:   { label: 'قيد الانتظار', className: 'bg-amber-100 text-amber-700',  icon: Clock },
  accepted:  { label: 'مقبول',         className: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  rejected:  { label: 'مرفوض',         className: 'bg-red-100 text-red-700',      icon: XCircle },
  completed: { label: 'منجز',           className: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'ملغى',           className: 'bg-gray-100 text-gray-600',   icon: XCircle },
};

export default function ContractsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewContractId, setReviewContractId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth');
  }, [authLoading, user, router]);

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

  const updateStatus = async (contractId: string, status: string) => {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', contractId);
    if (error) {
      toast.error('فشل التحديث: ' + error.message);
    } else {
      toast.success('تم تحديث حالة العقد');
      fetchContracts();
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewContractId) return;
    const contract = contracts.find((c) => c.id === reviewContractId);
    if (!contract) return;
    const commentErr = reviewComment ? validateComment(reviewComment) : null;
    if (commentErr) { toast.error(commentErr); return; }
    setSubmitting(true);
    const reviewedId = contract.employer_id === user.id ? contract.worker_id : contract.employer_id;
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      reviewed_id: reviewedId,
      contract_id: contract.id,
      rating: reviewRating,
      comment: reviewComment ? sanitizeText(reviewComment) : null,
    });
    setSubmitting(false);
    if (error) {
      toast.error('فشل إرسال التقييم: ' + error.message);
    } else {
      toast.success('تم إرسال التقييم بنجاح');
      setReviewContractId(null);
      setReviewRating(5);
      setReviewComment('');
    }
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!user) return null;

  const isEmployer = profile?.role === 'employer';
  const pending = contracts.filter((c) => c.status === 'pending');
  const active = contracts.filter((c) => c.status === 'accepted');
  const completed = contracts.filter((c) => c.status === 'completed');

  const ContractCard = ({ contract }: { contract: Contract }) => {
    const other = contract.employer_id === user.id ? contract.worker : contract.employer;
    const cfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${cfg.className.split(' ')[1]}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold">{contract.title}</h3>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-primary font-bold text-sm">{contract.amount.toLocaleString()} دج</span>
                  <Badge className={`${cfg.className} border-0 text-xs`}>{cfg.label}</Badge>
                </div>
              </div>
              {other && (
                <Link href={`/profile/${other.id}`} className="flex items-center gap-2 mb-2 hover:opacity-80">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{other.full_name?.charAt(0) || '؟'}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{other.full_name || 'مستخدم'}</span>
                </Link>
              )}
              {contract.terms && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{contract.terms}</p>}
              <p className="text-xs text-muted-foreground mb-3">{new Date(contract.created_at).toLocaleDateString('ar-DZ')}</p>

              <div className="flex flex-wrap gap-2">
                {contract.status === 'pending' && isEmployer && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(contract.id, 'accepted')}>قبول</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(contract.id, 'rejected')}>رفض</Button>
                  </>
                )}
                {contract.status === 'accepted' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(contract.id, 'completed')}>
                    <CheckCircle className="h-3.5 w-3.5 ml-1.5" />
                    تمييز كمنجز
                  </Button>
                )}
                {contract.status === 'completed' && (
                  <Button size="sm" variant="outline" onClick={() => setReviewContractId(contract.id)}>
                    <Star className="h-3.5 w-3.5 ml-1.5" />
                    إضافة تقييم
                  </Button>
                )}
                {(contract.status === 'pending' || contract.status === 'accepted') && (
                  <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => updateStatus(contract.id, 'cancelled')}>
                    إلغاء
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">العقود</h1>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}</div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">لا توجد عقود بعد</p>
        </div>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">الكل ({contracts.length})</TabsTrigger>
            <TabsTrigger value="pending">انتظار ({pending.length})</TabsTrigger>
            <TabsTrigger value="active">نشط ({active.length})</TabsTrigger>
            <TabsTrigger value="completed">منجز ({completed.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{contracts.map((c) => <ContractCard key={c.id} contract={c} />)}</TabsContent>
          <TabsContent value="pending">{pending.map((c) => <ContractCard key={c.id} contract={c} />)}</TabsContent>
          <TabsContent value="active">{active.map((c) => <ContractCard key={c.id} contract={c} />)}</TabsContent>
          <TabsContent value="completed">{completed.map((c) => <ContractCard key={c.id} contract={c} />)}</TabsContent>
        </Tabs>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewContractId} onOpenChange={(o) => !o && setReviewContractId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إضافة تقييم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReview} className="space-y-4 mt-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">التقييم</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewRating(n)}
                    className={`h-9 w-9 rounded-lg border-2 transition-colors font-bold text-sm ${n <= reviewRating ? 'bg-amber-400 border-amber-400 text-white' : 'border-border hover:border-amber-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">تعليق (اختياري)</p>
              <Textarea placeholder="أضف تعليقك على هذا العمل..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} rows={3} />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setReviewContractId(null)}>إلغاء</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                إرسال التقييم
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
