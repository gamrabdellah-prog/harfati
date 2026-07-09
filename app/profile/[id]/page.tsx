'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Star, Briefcase, MessageSquare, Calendar, Award, ExternalLink, Phone } from 'lucide-react';

type Review = Tables['reviews'] & { reviewer: Tables['profiles'] | null };

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<Tables['profiles'] | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: p }, { data: r }, { data: w }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('reviews').select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)').eq('reviewed_id', id).order('created_at', { ascending: false }),
        supabase.from('wilayas').select('*').order('id'),
      ]);
      setProfile(p ?? null);
      setReviews((r as Review[]) || []);
      setWilayas(w || []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-20 w-20 rounded-full" />
          <div className="space-y-2"><Skeleton className="h-6 w-48" /><Skeleton className="h-4 w-32" /></div>
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground text-lg">المستخدم غير موجود</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/')}>الرئيسية</Button>
      </div>
    );
  }

  const isMe = user?.id === profile.id;
  const isWorker = profile.role === 'worker';
  const wilayaName = wilayas.find((w) => w.id === profile.wilaya_id)?.name || 'الجزائر';

  const availabilityConfig: Record<string, { label: string; color: string }> = {
    available: { label: 'متاح', color: 'bg-green-100 text-green-700' },
    busy: { label: 'مشغول', color: 'bg-amber-100 text-amber-700' },
    unavailable: { label: 'غير متاح', color: 'bg-red-100 text-red-600' },
  };
  const avail = availabilityConfig[profile.availability] || availabilityConfig.unavailable;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-primary to-primary-700" />
        <CardContent className="p-6 -mt-10">
          <div className="flex flex-wrap items-end gap-4 mb-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-primary text-white font-bold text-2xl">
                {profile.full_name?.charAt(0) || '؟'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-4">
              <h1 className="text-xl font-bold">{profile.full_name || 'مستخدم'}</h1>
              <p className="text-muted-foreground">
                {isWorker ? (profile.specialty || 'حرفي') : (profile.company_name || 'صاحب عمل')}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isMe && user && (
                <Button size="sm" asChild>
                  <Link href={`/messages?user=${profile.id}`}>
                    <MessageSquare className="h-4 w-4 ml-1.5" />
                    مراسلة
                  </Link>
                </Button>
              )}
              {isMe && (
                <Button size="sm" variant="outline" asChild>
                  <Link href="/dashboard">تعديل الملف</Link>
                </Button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {wilayaName}
            </span>
            {profile.avg_rating > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <Star className="h-4 w-4 fill-current" />
                {profile.avg_rating.toFixed(1)} ({profile.review_count} تقييم)
              </span>
            )}
            {profile.phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {profile.phone}
              </span>
            )}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${avail.color}`}>
              {avail.label}
            </span>
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          )}

          {/* Social Links */}
          {(profile.facebook_url || profile.instagram_url || profile.linkedin_url) && (
            <div className="flex gap-3 mt-4">
              {profile.facebook_url && (
                <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  فيسبوك
                </a>
              )}
              {profile.instagram_url && (
                <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  إنستغرام
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  لينكدإن
                </a>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">المعلومات</TabsTrigger>
          <TabsTrigger value="reviews">التقييمات ({reviews.length})</TabsTrigger>
          {isWorker && <TabsTrigger value="skills">المهارات</TabsTrigger>}
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              {isWorker ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">الأجر بالساعة</p>
                      <p className="font-semibold">{profile.hourly_rate ? `${profile.hourly_rate} دج` : 'غير محدد'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">سنوات الخبرة</p>
                      <p className="font-semibold">{profile.years_experience ? `${profile.years_experience} سنة` : 'غير محدد'}</p>
                    </div>
                  </div>
                  {profile.cv_url && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">السيرة الذاتية</p>
                      <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                        <ExternalLink className="h-3 w-3" />
                        تحميل السيرة الذاتية
                      </a>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">اسم الشركة / المؤسسة</p>
                  <p className="font-semibold">{profile.company_name || 'غير محدد'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد تقييمات بعد</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {review.reviewer?.full_name?.charAt(0) || '؟'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="font-medium text-sm">{review.reviewer?.full_name || 'مستخدم'}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString('ar-DZ')}</p>
                        </div>
                        <div className="flex gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3.5 w-3.5 text-amber-400 ${i < review.rating ? 'fill-current' : 'fill-none'}`} />
                          ))}
                        </div>
                        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {isWorker && (
          <TabsContent value="skills" className="mt-4">
            <Card>
              <CardContent className="p-6">
                {profile.skills && profile.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-sm">{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">لا توجد مهارات مسجلة</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
