'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileText, CheckCircle, XCircle, Clock, Star, ChevronLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeText, formatNumber, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
type Contract = Tables['contracts'] & { employer: Tables['profiles'] | null; worker: Tables['profiles'] | null };
const STATUS: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'في الانتظار', color: 'badge-pending', icon: Clock },
  accepted: { label: 'مقبول', color: 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold', icon: CheckCircle },
  rejected: { label: 'مرفوض', color: 'badge-rejected', icon: XCircle },
  completed: { label: 'منجز', color: 'badge-completed', icon: CheckCircle },
  cancelled: { label: 'ملغى', color: 'bg-gray-100 text-gray-500 border border-gray-200 font-semibold', icon: XCircle },
};
export default function ContractsPage() {
  const { user, profile, loading: al } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [sub, setSub] = useState(false);
  useEffect(() => { if (!al && !user) router.push('/auth'); }, [al, user, router]);
  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase.from('contracts').select('*, employer:profiles!contracts_employer_id_fkey(*), worker:profiles!contracts_worker_id_fkey(*)').or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at', { ascending: false });
    setContracts((data as Contract[]) || []); setLoading(false);
  };
  useEffect(() => { fetch(); }, [user]);
  const updateStatus = async (id: string, status: string) => { const { error } = await supabase.from('contracts').update({ status }).eq('id', id); if (error) toast.error(error.message); else { toast.success('تم التحديث'); fetch(); } };
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user || !reviewId) return;
    const c = contracts.find(x => x.id === reviewId); if (!c) return;
    setSub(true);
    const rid = c.employer_id === user.id ? c.worker_id : c.employer_id;
    const { error } = await supabase.from('reviews').insert({ reviewer_id: user.id, reviewed_id: rid, contract_id: c.id, rating, comment: comment ? sanitizeText(comment) : null });
    setSub(false);
    if (error) toast.error(error.message); else { toast.success('⭐ شكراً على تقييمك!'); setReviewId(null); setRating(5); setComment(''); }
  };
  if (al) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500" /></div>;
  if (!user) return null;
  const isEmployer = profile?.role === 'employer';
  const pending = contracts.filter(c => c.status === 'pending');
  const active = contracts.filter(c => c.status === 'accepted');
  const done = contracts.filter(c => c.status === 'completed');
  const ContractCard = ({ c }: { c: Contract }) => {
    const other = c.employer_id === user.id ? c.worker : c.employer;
    const cfg = STATUS[c.status] || STATUS.pending; const Icon = cfg.icon;
    return (
      <div className="bg-white rounded-3xl border shadow-card p-7 mb-4">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div><h3 className="font-black text-base mb-1.5">{c.title}</h3><div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-orange-400" /><span className="text-2xl font-black text-orange-600">{formatNumber(c.amount)}</span><span className="text-sm text-muted-foreground">دج</span></div></div>
          <span className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full shrink-0', cfg.color)}><Icon className="h-3.5 w-3.5" />{cfg.label}</span>
        </div>
        {other && (<Link href={`/profile/${other.id}`} className="flex items-center gap-3 mb-5 p-3 rounded-2xl hover:bg-muted/50 transition-colors group -mx-1"><Avatar className="h-11 w-11 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all"><AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black">{other.full_name?.charAt(0) || '?'}</AvatarFallback></Avatar><div className="flex-1"><p className="font-bold text-sm group-hover:text-orange-600">{other.full_name || 'مستخدم'}</p></div><ChevronLeft className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" /></Link>)}
        {c.terms && <p className="text-sm text-muted-foreground bg-muted/40 rounded-2xl p-4 mb-5 line-clamp-2">{c.terms}</p>}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed items-center">
          {c.status === 'pending' && isEmployer && (<><Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-1.5" onClick={() => updateStatus(c.id, 'accepted')}><CheckCircle className="h-3.5 w-3.5" />قبول</Button><Button size="sm" variant="destructive" className="rounded-xl gap-1.5" onClick={() => updateStatus(c.id, 'rejected')}><XCircle className="h-3.5 w-3.5" />رفض</Button></>)}
          {c.status === 'accepted' && <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => updateStatus(c.id, 'completed')}><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />تمييز كمنجز</Button>}
          {c.status === 'completed' && <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={() => setReviewId(c.id)}><Star className="h-3.5 w-3.5 text-amber-400" />تقييم</Button>}
          {(c.status === 'pending' || c.status === 'accepted') && <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 rounded-xl mr-auto" onClick={() => updateStatus(c.id, 'cancelled')}>إلغاء</Button>}
          <span className="text-xs text-muted-foreground mr-auto">{formatDate(c.created_at)}</span>
        </div>
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b"><div className="max-w-3xl mx-auto px-4 py-10"><span className="section-tag mb-4">العقود</span><h1 className="text-4xl font-black mt-3 mb-2">إدارة العقود</h1><p className="text-muted-foreground">تتبع وأدر جميع عقودك</p></div></div>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (<div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-3xl" />)}</div>)
        : contracts.length === 0 ? (<div className="text-center py-28 text-muted-foreground"><FileText className="h-20 w-20 mx-auto mb-5 opacity-10" /><h3 className="text-2xl font-black mb-3">لا توجد عقود بعد</h3></div>)
        : (<Tabs defaultValue="all">
            <TabsList className="mb-8"><TabsTrigger value="all">الكل ({contracts.length})</TabsTrigger><TabsTrigger value="pending">انتظار ({pending.length})</TabsTrigger><TabsTrigger value="active">نشط ({active.length})</TabsTrigger><TabsTrigger value="done">منجز ({done.length})</TabsTrigger></TabsList>
            <TabsContent value="all">{contracts.map(c => <ContractCard key={c.id} c={c} />)}</TabsContent>
            <TabsContent value="pending">{pending.length === 0 ? <p className="text-center text-muted-foreground py-12">لا شيء</p> : pending.map(c => <ContractCard key={c.id} c={c} />)}</TabsContent>
            <TabsContent value="active">{active.length === 0 ? <p className="text-center text-muted-foreground py-12">لا شيء</p> : active.map(c => <ContractCard key={c.id} c={c} />)}</TabsContent>
            <TabsContent value="done">{done.length === 0 ? <p className="text-center text-muted-foreground py-12">لا شيء</p> : done.map(c => <ContractCard key={c.id} c={c} />)}</TabsContent>
          </Tabs>)}
      </div>
      <Dialog open={!!reviewId} onOpenChange={o => !o && setReviewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-400" />إضافة تقييم</DialogTitle></DialogHeader>
          <form onSubmit={handleReview} className="space-y-6 mt-3">
            <div><p className="text-sm font-bold mb-4">اختر تقييمك</p><div className="flex gap-3 justify-center">{[1,2,3,4,5].map(n => <button key={n} type="button" onClick={() => setRating(n)} className={cn('h-14 w-14 rounded-2xl border-2 font-black text-xl transition-all', n <= rating ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-amber-400 text-white shadow-orange' : 'border-border hover:border-amber-300 text-muted-foreground')}>{n}</button>)}</div></div>
            <div><p className="text-sm font-bold mb-2">تعليق (اختياري)</p><Textarea placeholder="شارك تجربتك..." value={comment} onChange={e => setComment(e.target.value)} rows={4} /></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" className="rounded-2xl" onClick={() => setReviewId(null)}>إلغاء</Button><Button type="submit" variant="premium" className="rounded-2xl gap-2" disabled={sub}>{sub && <Loader2 className="h-4 w-4 animate-spin" />}إرسال</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
