'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Star, MessageSquare, Phone, ExternalLink, Award, Briefcase, Edit3 } from 'lucide-react';
import { cn, formatNumber, formatDate } from '@/lib/utils';

type Review = Tables['reviews'] & { reviewer: Tables['profiles'] | null };

const AVAIL_MAP: Record<string, { label: string; cls: string; dot: string }> = {
  available: { label: 'متاح الآن', cls: 'badge-available', dot: 'bg-emerald-500' },
  busy: { label: 'مشغول', cls: 'badge-busy', dot: 'bg-amber-500' },
  unavailable: { label: 'غير متاح', cls: 'badge-unavailable', dot: 'bg-red-500' },
};

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Tables['profiles'] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [{ data: p }, { data: r }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)').eq('reviewed_id', id).order('created_at', { ascending: false }),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setProfile(p ?? null); setReviews((r as Review[]) || []); setWilayas(w || []); setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-5">
      <div className="rounded-3xl bg-white border overflow-hidden">
        <div className="h-36 bg-muted" />
        <div className="p-8 space-y-4">
          <div className="flex items-end gap-4 -mt-16"><Skeleton className="h-24 w-24 rounded-full" /><div className="flex-1 space-y-2 pb-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-32" /></div></div>
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="max-w-3xl mx-auto px-4 py-28 text-center">
      <p className="text-2xl font-black mb-3">المستخدم غير موجود</p>
      <Button variant="orange-outline" className="rounded-2xl mt-4" onClick={() => router.push('/')}>الرئيسية</Button>
    </div>
  );

  const isMe = user?.id === profile.id;
  const isWorker = profile.role === 'worker';
  const wName = wilayas.find(w => w.id === profile.wilaya_id)?.name || 'الجزائر';
  const avail = AVAIL_MAP[profile.availability] || AVAIL_MAP.unavailable;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        {/* Profile card */}
        <div className="bg-white rounded-3xl border shadow-card overflow-hidden">
          {/* Cover */}
          <div className="relative h-36 bg-gradient-to-br from-orange-400 via-orange-500 to-red-600">
            <div className="absolute inset-0 pattern-hero opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            {isMe && (
              <Link href="/dashboard" className="absolute top-4 left-4 h-9 w-9 rounded-xl bg-white/15 border border-white/30 flex items-center justify-center hover:bg-white/25 transition-colors">
                <Edit3 className="h-4 w-4 text-white" />
              </Link>
            )}
          </div>

          <div className="px-8 pb-8 -mt-14">
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <Avatar className="h-24 w-24 ring-4 ring-white shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black text-3xl">
                  {profile.full_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2 pb-1 ml-auto">
                {!isMe && user && (
                  <Button variant="premium" size="sm" className="gap-2 rounded-2xl shadow-orange" asChild>
                    <Link href={`/messages?user=${profile.id}`}><MessageSquare className="h-4 w-4" />مراسلة</Link>
                  </Button>
                )}
                {isMe && (
                  <Button variant="outline" size="sm" className="gap-2 rounded-2xl" asChild>
                    <Link href="/dashboard"><Edit3 className="h-4 w-4" />تعديل الملف</Link>
                  </Button>
                )}
              </div>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-black">{profile.full_name || 'مستخدم'}</h1>
                <span className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full', avail.cls)}>
                  <span className={cn('h-2 w-2 rounded-full', avail.dot, avail.dot === 'bg-emerald-500' && 'animate-pulse')} />
                  {avail.label}
                </span>
              </div>
              <p className="text-muted-foreground text-base mb-5">
                {isWorker ? (profile.specialty || 'حرفي') : (profile.company_name || 'صاحب عمل')}
              </p>

              <div className="flex flex-wrap gap-5 text-sm mb-5">
                <span className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-orange-400" />{wName}</span>
                {profile.avg_rating > 0 && (
                  <span className="flex items-center gap-2">
                    <Star className="h-4 w-4 star-fill" />
                    <span className="font-black">{profile.avg_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({profile.review_count} تقييم)</span>
                  </span>
                )}
                {profile.phone && <span className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4 text-orange-400" />{profile.phone}</span>}
              </div>

              {profile.bio && (
                <p className="text-foreground/75 leading-relaxed bg-muted/40 rounded-2xl p-5 text-sm">{profile.bio}</p>
              )}

              {(profile.facebook_url || profile.instagram_url || profile.linkedin_url) && (
                <div className="flex gap-4 mt-5">
                  {[['facebook_url', 'فيسبوك'], ['instagram_url', 'إنستغرام'], ['linkedin_url', 'لينكدإن']].map(([key, label]) => {
                    const url = (profile as any)[key];
                    if (!url) return null;
                    return (
                      <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-600 transition-colors border border-border rounded-xl px-3 py-2 hover:border-orange-300">
                        <ExternalLink className="h-3 w-3" />{label}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info">
          <TabsList className="mb-6">
            <TabsTrigger value="info"><Briefcase className="h-3.5 w-3.5" />المعلومات</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="h-3.5 w-3.5" />التقييمات ({reviews.length})</TabsTrigger>
            {isWorker && <TabsTrigger value="skills"><Award className="h-3.5 w-3.5" />المهارات</TabsTrigger>}
          </TabsList>

          <TabsContent value="info">
            <div className="bg-white rounded-3xl border shadow-card p-7">
              {isWorker ? (
                <div className="grid grid-cols-2 gap-5">
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6 text-center">
                    <p className="text-xs text-orange-500 font-semibold mb-2 uppercase tracking-wide">الأجر بالساعة</p>
                    <p className="text-3xl font-black text-orange-700">{profile.hourly_rate ? formatNumber(profile.hourly_rate) : '—'}</p>
                    <p className="text-xs text-orange-400 mt-1">دينار جزائري</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6 text-center">
                    <p className="text-xs text-blue-500 font-semibold mb-2 uppercase tracking-wide">سنوات الخبرة</p>
                    <p className="text-3xl font-black text-blue-700">{profile.years_experience || '—'}</p>
                    <p className="text-xs text-blue-400 mt-1">سنوات</p>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3">اسم المؤسسة / الشركة</p>
                  <p className="font-bold text-xl">{profile.company_name || 'غير محدد'}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            {reviews.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground bg-white rounded-3xl border shadow-card">
                <Star className="h-16 w-16 mx-auto mb-4 opacity-10" />
                <h3 className="text-xl font-black mb-2">لا توجد تقييمات بعد</h3>
                <p className="text-sm">ستظهر هنا التقييمات بعد إتمام العقود</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-white rounded-3xl border shadow-card p-6">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 ring-2 ring-orange-100 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-700 text-white font-black">
                          {r.reviewer?.full_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold">{r.reviewer?.full_name || 'مستخدم'}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                        </div>
                        <div className="flex gap-0.5 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-4 w-4', i < r.rating ? 'star-fill' : 'star-empty')} />)}
                        </div>
                        {r.comment && <p className="text-sm text-muted-foreground bg-muted/40 rounded-2xl p-4 leading-relaxed">{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {isWorker && (
            <TabsContent value="skills">
              <div className="bg-white rounded-3xl border shadow-card p-7">
                {profile.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {profile.skills.map(s => (
                      <span key={s} className="flex items-center gap-2 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-700 border border-orange-100 px-5 py-2.5 rounded-2xl font-semibold">
                        <Award className="h-4 w-4 text-orange-400" />{s}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">لا توجد مهارات مسجلة</p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
