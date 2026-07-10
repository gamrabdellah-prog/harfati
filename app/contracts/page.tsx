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
import { Loader2, FileText, CheckCircle, XCircle, Clock, Star, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { sanitizeText } from '@/lib/validation';
import { cn } from '@/lib/utils';
type Contract = Tables['contracts'] & { employer: Tables['profiles']|null; worker: Tables['profiles']|null };
const STATUS: Record<string,{label:string;color:string;icon:React.ElementType}> = {
  pending:{label:'انتظار',color:'bg-amber-50 text-amber-700 border-amber-200',icon:Clock},
  accepted:{label:'مقبول',color:'bg-blue-50 text-blue-700 border-blue-200',icon:CheckCircle},
  rejected:{label:'مرفوض',color:'bg-red-50 text-red-600 border-red-200',icon:XCircle},
  completed:{label:'منجز',color:'bg-emerald-50 text-emerald-700 border-emerald-200',icon:CheckCircle},
  cancelled:{label:'ملغى',color:'bg-gray-100 text-gray-500 border-gray-200',icon:XCircle},
};
export default function ContractsPage() {
  const { user, profile, loading:al } = useAuth(); const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewId, setReviewId] = useState<string|null>(null);
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(''); const [sub, setSub] = useState(false);
  useEffect(()=>{if(!al&&!user)router.push('/auth');},[al,user,router]);
  const fetchContracts = async()=>{
    if(!user)return;
    const {data}=await supabase.from('contracts').select('*,employer:profiles!contracts_employer_id_fkey(*),worker:profiles!contracts_worker_id_fkey(*)').or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`).order('created_at',{ascending:false});
    setContracts((data as Contract[])||[]); setLoading(false);
  };
  useEffect(()=>{fetchContracts();},[user]);
  const updateStatus=async(id:string,status:string)=>{const {error}=await supabase.from('contracts').update({status}).eq('id',id);if(error)toast.error(error.message);else{toast.success('تم التحديث');fetchContracts();}};
  const handleReview=async(e:React.FormEvent)=>{
    e.preventDefault(); if(!user||!reviewId)return;
    const c=contracts.find(x=>x.id===reviewId); if(!c)return;
    setSub(true);
    const reviewedId=c.employer_id===user.id?c.worker_id:c.employer_id;
    const {error}=await supabase.from('reviews').insert({reviewer_id:user.id,reviewed_id:reviewedId,contract_id:c.id,rating,comment:comment?sanitizeText(comment):null});
    setSub(false);
    if(error)toast.error(error.message);
    else{toast.success('تم إرسال التقييم ⭐');setReviewId(null);setRating(5);setComment('');}
  };
  if(al)return<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-orange-500"/></div>;
  if(!user)return null;
  const isEmployer=profile?.role==='employer';
  const pending=contracts.filter(c=>c.status==='pending');
  const active=contracts.filter(c=>c.status==='accepted');
  const done=contracts.filter(c=>c.status==='completed');

  const ContractCard=({c}:{c:Contract})=>{
    const other=c.employer_id===user.id?c.worker:c.employer;
    const cfg=STATUS[c.status]||STATUS.pending; const Icon=cfg.icon;
    return(
      <div className="bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-6 mb-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">{c.title}</h3>
            <p className="text-2xl font-black text-orange-600">{c.amount.toLocaleString()} <span className="text-base font-normal text-muted-foreground">دج</span></p>
          </div>
          <span className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-semibold shrink-0',cfg.color)}><Icon className="h-3.5 w-3.5"/>{cfg.label}</span>
        </div>
        {other&&(
          <Link href={`/profile/${other.id}`} className="flex items-center gap-3 mb-4 group">
            <Avatar className="h-9 w-9 ring-2 ring-orange-100 group-hover:ring-orange-300 transition-all"><AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-bold">{other.full_name?.charAt(0)||'?'}</AvatarFallback></Avatar>
            <div className="flex-1"><p className="text-sm font-semibold group-hover:text-orange-600 transition-colors">{other.full_name||'مستخدم'}</p></div>
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"/>
          </Link>
        )}
        {c.terms&&<p className="text-sm text-muted-foreground line-clamp-2 mb-4 bg-muted/50 rounded-xl p-3">{c.terms}</p>}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-dashed">
          {c.status==='pending'&&isEmployer&&<><Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={()=>updateStatus(c.id,'accepted')}>قبول ✓</Button><Button size="sm" variant="destructive" onClick={()=>updateStatus(c.id,'rejected')}>رفض ✕</Button></>}
          {c.status==='accepted'&&<Button size="sm" variant="outline" className="gap-1.5" onClick={()=>updateStatus(c.id,'completed')}><CheckCircle className="h-3.5 w-3.5 text-emerald-500"/>تمييز كمنجز</Button>}
          {c.status==='completed'&&<Button size="sm" variant="outline" className="gap-1.5" onClick={()=>setReviewId(c.id)}><Star className="h-3.5 w-3.5 text-amber-400"/>إضافة تقييم</Button>}
          {(c.status==='pending'||c.status==='accepted')&&<Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500 mr-auto" onClick={()=>updateStatus(c.id,'cancelled')}>إلغاء</Button>}
          <span className="text-xs text-muted-foreground self-center mr-auto">{new Date(c.created_at).toLocaleDateString('ar-DZ')}</span>
        </div>
      </div>
    );
  };

  return(
    <div className="min-h-screen bg-muted/20">
      <div className="bg-white border-b"><div className="container mx-auto px-4 max-w-3xl py-8"><h1 className="text-3xl font-black">العقود</h1><p className="text-muted-foreground mt-1">تتبع جميع عقودك ومشاريعك</p></div></div>
      <div className="container mx-auto px-4 max-w-3xl py-8">
        {loading?<div className="space-y-4">{Array.from({length:3}).map((_,i)=><Skeleton key={i} className="h-40 w-full rounded-2xl"/>)}</div>
        :contracts.length===0?(
          <div className="text-center py-24 text-muted-foreground"><FileText className="h-16 w-16 mx-auto mb-4 opacity-20"/><h3 className="text-xl font-bold mb-2">لا توجد عقود بعد</h3><p className="text-sm">ستظهر هنا عقودك عند بدء التعاملات</p></div>
        ):(
          <Tabs defaultValue="all">
            <TabsList className="mb-6">
              <TabsTrigger value="all">الكل ({contracts.length})</TabsTrigger>
              <TabsTrigger value="pending">انتظار ({pending.length})</TabsTrigger>
              <TabsTrigger value="active">نشط ({active.length})</TabsTrigger>
              <TabsTrigger value="done">منجز ({done.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{contracts.map(c=><ContractCard key={c.id} c={c}/>)}</TabsContent>
            <TabsContent value="pending">{pending.length===0?<p className="text-center py-12 text-muted-foreground">لا توجد عقود في الانتظار</p>:pending.map(c=><ContractCard key={c.id} c={c}/>)}</TabsContent>
            <TabsContent value="active">{active.length===0?<p className="text-center py-12 text-muted-foreground">لا توجد عقود نشطة</p>:active.map(c=><ContractCard key={c.id} c={c}/>)}</TabsContent>
            <TabsContent value="done">{done.length===0?<p className="text-center py-12 text-muted-foreground">لا توجد عقود منجزة</p>:done.map(c=><ContractCard key={c.id} c={c}/>)}</TabsContent>
          </Tabs>
        )}
      </div>
      <Dialog open={!!reviewId} onOpenChange={o=>!o&&setReviewId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="h-5 w-5 text-amber-400"/>إضافة تقييم</DialogTitle></DialogHeader>
          <form onSubmit={handleReview} className="space-y-5 mt-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold">التقييم</p>
              <div className="flex gap-2 justify-center">
                {[1,2,3,4,5].map(n=>(
                  <button key={n} type="button" onClick={()=>setRating(n)} className={cn('h-12 w-12 rounded-xl border-2 font-black text-lg transition-all',n<=rating?'bg-amber-400 border-amber-400 text-white shadow-md shadow-amber-400/30':'border-gray-200 hover:border-amber-300 text-gray-400')}>{n}</button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><p className="text-sm font-semibold">تعليق</p><Textarea placeholder="شارك تجربتك..." value={comment} onChange={e=>setComment(e.target.value)} rows={3}/></div>
            <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={()=>setReviewId(null)}>إلغاء</Button><Button type="submit" variant="premium" disabled={sub}>{sub&&<Loader2 className="ml-2 h-4 w-4 animate-spin"/>}إرسال</Button></div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
