'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, Clock, CheckCircle, XCircle, Star, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { validateComment, sanitizeText } from '@/lib/validation';

export default function ContractsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [contracts, setContracts] = useState<(Tables['contracts'] & { employer: Tables['profiles'] | null; worker: Tables['profiles'] | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchContracts = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('contracts')
        .select('*, employer:profiles!contracts_employer_id_fkey(*), worker:profiles!contracts_worker_id_fkey(*)')
        .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
        .order('created_at', { ascending: false });
      setContracts(data || []);
      setLoading(false);
    };
    fetchContracts();
  }, [user]);

  const updateStatus = async (contractId: string, status: 'accepted' | 'rejected' | 'completed' | 'cancelled') => {
    const { error } = await supabase.from('contracts').update({ status }).eq('id', contractId);
    if (error) {
      toast.error('فشل التحديث: ' + error.message);
    } else {
      toast.success('تم تحديث حالة العقد');
      const { data } = await supabase
        .from('contracts')
        .select('*, employer:profiles!contracts_employer_id_fkey(*), worker:profiles!contracts_worker_id_fkey(*)')
        .or(`employer_id.eq.${user?.id},worker_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });
      setContracts(data || []);
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedContract) return;
    const contract = contracts.find(c => c.id === selectedContract);
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
      setReviewOpen(false);
      setReviewRating(5);
      setReviewComment('');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="secondary">قيد الانتظار</Badge>;
      case 'accepted': return <Badge variant="default">مقبول</Badge>;
      case 'rejected': return <Badge variant="destructive">مرفوض</Badge>;
      case 'completed': return <Badge variant="outline">منجز</Badge>;
      case 'cancelled': return <Badge variant="destructive">ملغى</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-muted-foreground" />;
      case 'accepted': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'rejected': return <XCircle className="w-5 h-5 text-error-500" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-success-500" />;
      case 'cancelled': return <XCircle className="w-5 h-5 text-error-500" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  const isEmployer = profile?.role === 'employer';
  const pendingContracts = contracts.filter(c => c.status === 'pending');
  const activeContracts = contracts.filter(c => c.status === 'accepted');
  const completedContracts = contracts.filter(c => c.status === 'completed');
  const otherContracts = contracts.filter(c => !['pending', 'accepted', 'completed'].includes(c.status));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">العقود</h1>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse h-32" />
            ))}
          </div>
        ) : contracts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد عقود</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">الكل ({contracts.length})</TabsTrigger>
              <TabsTrigger value="pending">قيد الانتظار ({pendingContracts.length})</TabsTrigger>
              <TabsTrigger value="active">نشط ({activeContracts.length})</TabsTrigger>
              <TabsTrigger value="completed">منجز ({completedContracts.length})</TabsTrigger>
            </TabsList>

            {['all', 'pending', 'active', 'completed'].map((tab) => {
              const list = tab === 'all' ? contracts : tab === 'pending' ? pendingContracts : tab === 'active' ? activeContracts : completedContracts;
              return (
                <TabsContent key={tab} value={tab}>
                  <div className="space-y-4">
                    {list.map((contract) => {
                      const other = contract.employer_id === user.id ? contract.worker : contract.employer;
                      const isMyContract = contract.employer_id === user.id || contract.worker_id === user.id;
                      return (
                        <Card key={contract.id} className="border-border/60">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-4">
                              <div className="shrink-0">
                                {getStatusIcon(contract.status)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h3 className="font-bold">{contract.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">{contract.amount} دج</p>
                                    <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                                      <Link href={`/profile/${other?.id || ''}`} className="flex items-center gap-2 hover:text-primary-500 transition-colors">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback className="bg-primary-100 text-primary-600 text-xs font-bold">
                                            {other?.full_name?.charAt(0) || '؟'}
                                          </AvatarFallback>
                                        </Avatar>
                                        {other?.full_name || 'مستخدم'}
                                      </Link>
                                    </div>
                                  </div>
                                  {getStatusBadge(contract.status)}
                                </div>

                                {contract.terms && (
                                  <p className="text-sm text-muted-foreground mt-3 bg-muted p-3 rounded-lg">{contract.terms}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-4">
                                  {contract.status === 'pending' && !isEmployer && (
                                    <>
                                      <Button size="sm" className="bg-success-500 hover:bg-success-600 text-white" onClick={() => updateStatus(contract.id, 'accepted')}>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        قبول
                                      </Button>
                                      <Button size="sm" variant="outline" className="text-error-500 border-error-300 hover:bg-error-50" onClick={() => updateStatus(contract.id, 'rejected')}>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        رفض
                                      </Button>
                                    </>
                                  )}
                                  {contract.status === 'accepted' && (
                                    <Button size="sm" className="bg-success-500 hover:bg-success-600 text-white" onClick={() => updateStatus(contract.id, 'completed')}>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      إنهاء العمل
                                    </Button>
                                  )}
                                  {contract.status === 'completed' && isMyContract && (
                                    <Button size="sm" variant="outline" onClick={() => { setSelectedContract(contract.id); setReviewOpen(true); }}>
                                      <Star className="w-4 h-4 mr-2" />
                                      تقييم
                                    </Button>
                                  )}
                                  {contract.employer_id !== user.id && (
                                    <Link href={`/messages?user=${contract.employer_id}`}>
                                      <Button size="sm" variant="outline">
                                        <Send className="w-4 h-4 mr-2" />
                                        مراسلة
                                      </Button>
                                    </Link>
                                  )}
                                  {contract.worker_id !== user.id && (
                                    <Link href={`/messages?user=${contract.worker_id}`}>
                                      <Button size="sm" variant="outline">
                                        <Send className="w-4 h-4 mr-2" />
                                        مراسلة
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* Review Dialog */}
        <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>تقييم الطرف الآخر</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleReview} className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">التقييم</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReviewRating(r)}
                      className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                    >
                      <Star className={`w-6 h-6 ${r <= reviewRating ? 'text-warning-500 fill-warning-500' : 'text-gray-300'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">التعليق</label>
                <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="اكتب تعليقك..." />
              </div>
              <Button type="submit" className="w-full bg-primary-500 hover:bg-primary-600 text-white" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إرسال التقييم'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
