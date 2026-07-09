'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Star, Briefcase, MessageSquare, Calendar, Award, FileText, ExternalLink, Phone, Mail, User } from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams();
  const { user, profile: myProfile } = useAuth();
  const [profile, setProfile] = useState<Tables['profiles'] | null>(null);
  const [reviews, setReviews] = useState<(Tables['reviews'] & { reviewer: Tables['profiles'] | null })[]>([]);
  const [wilayas, setWilayas] = useState<Tables['wilayas'][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      setProfile(p || null);

      const { data: r } = await supabase
        .from('reviews')
        .select('*, reviewer:profiles!reviews_reviewer_id_fkey(*)')
        .eq('reviewed_id', id)
        .order('created_at', { ascending: false });
      setReviews(r || []);

      const { data: w } = await supabase.from('wilayas').select('*').order('id');
      setWilayas(w || []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="animate-pulse h-96" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">المستخدم غير موجود</p>
      </div>
    );
  }

  const isMe = user?.id === profile.id;
  const isWorker = profile.role === 'worker';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="border-border/60 shadow-sm mb-6">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <Avatar className="w-24 h-24 border-4 border-primary-100 shrink-0">
                <AvatarFallback className="bg-primary-100 text-primary-600 text-3xl font-bold">
                  {profile.full_name?.charAt(0) || '؟'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-1">{profile.full_name || 'مستخدم'}</h1>
                    <p className="text-primary-500 font-medium mb-2">
                      {isWorker ? profile.specialty || 'حرفي' : profile.company_name || 'صاحب عمل'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMe && user && (
                      <Link href={`/messages?user=${profile.id}`}>
                        <Button className="bg-primary-500 hover:bg-primary-600 text-white">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          مراسلة
                        </Button>
                      </Link>
                    )}
                    {isMe && (
                      <Link href="/dashboard">
                        <Button variant="outline">
                          <FileText className="w-4 h-4 mr-2" />
                          تعديل الملف
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {wilayas.find(w => w.id === profile.wilaya_id)?.name || 'الجزائر'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-warning-500 fill-warning-500" />
                    {profile.avg_rating} ({profile.review_count} تقييم)
                  </span>
                  {profile.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profile.phone}
                    </span>
                  )}
                  <Badge variant={profile.availability === 'available' ? 'default' : 'secondary'}>
                    {profile.availability === 'available' ? 'متاح' : profile.availability === 'busy' ? 'مشغول' : 'غير متاح'}
                  </Badge>
                </div>

                {profile.bio && (
                  <p className="mt-4 text-muted-foreground leading-relaxed">{profile.bio}</p>
                )}

                {/* Social Links */}
                {(profile.facebook_url || profile.instagram_url || profile.linkedin_url) && (
                  <div className="flex items-center gap-3 mt-4">
                    {profile.facebook_url && (
                      <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        فيسبوك
                      </a>
                    )}
                    {profile.instagram_url && (
                      <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        إنستغرام
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary-500 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        لينكدإن
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Tabs defaultValue="info">
          <TabsList className="mb-4">
            <TabsTrigger value="info">المعلومات</TabsTrigger>
            <TabsTrigger value="reviews">التقييمات ({reviews.length})</TabsTrigger>
            {isWorker && <TabsTrigger value="skills">المهارات</TabsTrigger>}
          </TabsList>

          <TabsContent value="info">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isWorker && (
                <>
                  <Card>
                    <CardContent className="p-5">
                      <div className="text-muted-foreground mb-2">
                        <span className="text-sm">الأجر بالساعة</span>
                      </div>
                      <div className="text-2xl font-bold text-primary-500">
                        {profile.hourly_rate ? `${profile.hourly_rate} دج` : 'غير محدد'}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">سنوات الخبرة</span>
                      </div>
                      <div className="text-2xl font-bold">
                        {profile.years_experience ? `${profile.years_experience} سنة` : 'غير محدد'}
                      </div>
                    </CardContent>
                  </Card>
                  {profile.cv_url && (
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm">السيرة الذاتية</span>
                        </div>
                        <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          تحميل
                        </a>
                      </CardContent>
                    </Card>
                  )}
                  {profile.identity_doc_url && (
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Award className="w-4 h-4" />
                          <span className="text-sm">وثيقة الهوية</span>
                        </div>
                        <a href={profile.identity_doc_url} target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline flex items-center gap-2">
                          <ExternalLink className="w-4 h-4" />
                          عرض
                        </a>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
              {!isWorker && (
                <Card className="md:col-span-2">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm">اسم الشركة / المؤسسة</span>
                    </div>
                    <div className="text-xl font-bold">{profile.company_name || 'غير محدد'}</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>لا توجد تقييمات بعد</p>
                  </CardContent>
                </Card>
              ) : (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-primary-100 text-primary-600 text-sm font-bold">
                            {review.reviewer?.full_name?.charAt(0) || '؟'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{review.reviewer?.full_name || 'مستخدم'}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-3 h-3 ${i < review.rating ? 'text-warning-500 fill-warning-500' : 'text-gray-300'}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground text-sm">{review.comment}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString('ar-DZ')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {isWorker && (
            <TabsContent value="skills">
              <Card>
                <CardContent className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {profile.skills && profile.skills.length > 0 ? (
                      profile.skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">لا توجد مهارات مسجلة</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
